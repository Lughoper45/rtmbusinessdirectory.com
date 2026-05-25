import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { AssistantError, openRouterChat } from "../_shared/openrouter.ts";
import {
  clientIp,
  createServiceClient,
  enforceHourlyRateLimit,
} from "../_shared/rateLimit.ts";

type ToolAction =
  | "analytics"
  | "find_customers"
  | "compliance"
  | "market_research"
  | "generate_report";

const AUTH_LIMIT = 80;

async function resolveUserId(
  req: Request,
  supabaseUrl: string,
  supabaseAnon: string,
): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
  const authClient = createClient(supabaseUrl, supabaseAnon);
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

function profileFromRow(row: { profile?: unknown } | null): Record<string, unknown> {
  if (row?.profile && typeof row.profile === "object") {
    return row.profile as Record<string, unknown>;
  }
  return {};
}

async function loadGrantProfile(admin: ReturnType<typeof createServiceClient>, userId: string) {
  const { data } = await admin
    .from("grant_profiles")
    .select("profile, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return profileFromRow(data);
}

function profileCompletionPct(profile: Record<string, unknown>): number {
  const keys = [
    "businessName",
    "industry",
    "location",
    "employeeCount",
    "annualRevenue",
    "fundingGoal",
    "projectDescription",
  ];
  const filled = keys.filter((k) => {
    const v = profile[k];
    return v != null && String(v).trim().length > 0;
  }).length;
  return Math.round((filled / keys.length) * 100);
}

async function handleAnalytics(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
) {
  const profile = await loadGrantProfile(admin, userId);
  const profileComplete = profileCompletionPct(profile);

  const { data: applications } = await admin
    .from("applications")
    .select("id, status, item_id, item_type, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  const apps = applications ?? [];
  const grantApps = apps.filter((a) => a.item_type === "grant");
  const approved = grantApps.filter((a) =>
    String(a.status).toLowerCase().includes("approve")
  ).length;

  const { data: intakes } = await admin
    .from("grant_intakes")
    .select("id, grant_id, status, readiness_score, readiness_status, updated_at")
    .eq("user_id", userId)
    .in("status", ["draft", "collecting", "ready_for_review", "with_advisor"])
    .order("updated_at", { ascending: false })
    .limit(20);

  const { count: grantsCount } = await admin
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const openIntakes = (intakes ?? []).length;
  const avgReadiness = (intakes ?? []).length
    ? Math.round(
        (intakes ?? []).reduce((s, i) => s + (i.readiness_score ?? 0), 0) /
          (intakes ?? []).length,
      )
    : 0;

  const pipeline = {
    exploring: grantApps.filter((a) =>
      ["draft", "pending", "exploring"].includes(String(a.status).toLowerCase()),
    ).length,
    inProgress: grantApps.filter((a) =>
      String(a.status).toLowerCase().includes("review"),
    ).length,
    submitted: grantApps.filter((a) =>
      String(a.status).toLowerCase().includes("submit"),
    ).length,
    approved,
  };

  const insights: string[] = [];
  if (profileComplete < 80) {
    insights.push(
      `Complete your grant profile (${profileComplete}%) to improve RTM compatibility estimates.`,
    );
  }
  if (openIntakes > 0) {
    insights.push(
      `You have ${openIntakes} active intake${openIntakes === 1 ? "" : "s"} — average readiness ${avgReadiness}%.`,
    );
  }
  if (grantApps.length === 0) {
    insights.push("Start your first grant application from the Grant Feed catalog.");
  } else if (approved > 0) {
    insights.push(`${approved} application(s) marked approved — review next steps with your advisor.`);
  }

  return {
    metrics: [
      {
        label: "Active applications",
        value: String(grantApps.length),
        change: grantApps.length > 0 ? "tracking" : "—",
        trend: "up" as const,
      },
      {
        label: "Open intakes",
        value: String(openIntakes),
        change: openIntakes > 0 ? "in progress" : "—",
        trend: openIntakes > 0 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Profile complete",
        value: `${profileComplete}%`,
        change: profileComplete >= 80 ? "ready" : "needs work",
        trend: profileComplete >= 80 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Programs in catalog",
        value: String(grantsCount ?? 0),
        change: "RTM database",
        trend: "up" as const,
      },
    ],
    pipeline,
    chart: (intakes ?? []).slice(0, 6).map((i, idx) => ({
      label: `Intake ${idx + 1}`,
      score: i.readiness_score ?? 0,
    })),
    insights,
    profileComplete,
  };
}

async function handleFindCustomers(
  admin: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>,
  profile: Record<string, unknown>,
) {
  const search = String(body?.search ?? "").trim().toLowerCase();
  const limit = Math.min(30, Math.max(5, Number(body?.limit) || 12));

  let query = admin
    .from("businesses")
    .select("id, name, category, location, phone, website, description, certification_level")
    .order("name", { ascending: true })
    .limit(limit);

  const industry = String(profile.industry ?? "").trim();
  const location = String(profile.location ?? "").trim();

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as Array<Record<string, unknown>>;

  if (search) {
    rows = rows.filter((b) => {
      const hay = `${b.name} ${b.category} ${b.location} ${b.description}`.toLowerCase();
      return hay.includes(search);
    });
  }

  if (industry) {
    const ind = industry.toLowerCase();
    rows = rows.sort((a, b) => {
      const ac = String(a.category ?? "").toLowerCase().includes(ind) ? 1 : 0;
      const bc = String(b.category ?? "").toLowerCase().includes(ind) ? 1 : 0;
      return bc - ac;
    });
  }

  const customers = rows.map((b, i) => {
    const cat = String(b.category ?? "Business");
    const loc = String(b.location ?? "Canada");
    let match = 72;
    if (industry && cat.toLowerCase().includes(industry.toLowerCase())) match += 12;
    if (location && loc.toLowerCase().includes(location.split(",")[0].toLowerCase())) match += 8;
    match = Math.min(98, match + (i < 3 ? 5 - i : 0));
    return {
      id: String(b.id),
      name: String(b.name),
      industry: cat,
      location: loc,
      match,
      phone: b.phone ? String(b.phone) : null,
      website: b.website ? String(b.website) : null,
      email: null,
    };
  });

  return { customers, total: customers.length, filteredBy: { search, industry, location } };
}

async function handleCompliance(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
  profile: Record<string, unknown>,
) {
  const items: Array<{
    id: string;
    label: string;
    status: "complete" | "pending" | "overdue";
    dueInDays?: number;
    category: string;
  }> = [];

  const checks: Array<{ key: string; label: string }> = [
    { key: "businessName", label: "Business legal name on profile" },
    { key: "industry", label: "Industry / sector" },
    { key: "location", label: "Province or city" },
    { key: "employeeCount", label: "Company size" },
    { key: "projectDescription", label: "Project summary for grant applications" },
  ];

  for (const c of checks) {
    const ok = profile[c.key] != null && String(profile[c.key]).trim().length > 0;
    items.push({
      id: `profile-${c.key}`,
      label: c.label,
      status: ok ? "complete" : "pending",
      category: "Grant profile",
    });
  }

  const { data: intakes } = await admin
    .from("grant_intakes")
    .select("id, grant_id, readiness_score, readiness_status, status")
    .eq("user_id", userId)
    .in("status", ["collecting", "ready_for_review", "with_advisor"])
    .limit(10);

  for (const intake of intakes ?? []) {
    const score = intake.readiness_score ?? 0;
    items.push({
      id: `intake-${intake.id}`,
      label: `Grant intake readiness (${intake.grant_id}) — ${score}%`,
      status: score >= 70 ? "complete" : score >= 40 ? "pending" : "overdue",
      category: "Grant intake",
    });
  }

  const { data: grants } = await admin
    .from("grants")
    .select("id, name, deadline")
    .eq("is_active", true)
    .not("deadline", "is", null)
    .order("deadline", { ascending: true })
    .limit(5);

  const now = Date.now();
  for (const g of grants ?? []) {
    if (!g.deadline) continue;
    const due = new Date(String(g.deadline)).getTime();
    const days = Math.ceil((due - now) / (86400 * 1000));
    if (days < 0 || days > 60) continue;
    items.push({
      id: `deadline-${g.id}`,
      label: `${g.name} — program deadline`,
      status: days <= 7 ? "overdue" : days <= 21 ? "pending" : "complete",
      dueInDays: Math.max(0, days),
      category: "Program deadline",
    });
  }

  items.push({
    id: "biz-license-renewal",
    label: "Business license renewal",
    status: "pending",
    dueInDays: 7,
    category: "Business compliance",
  });
  items.push({
    id: "tax-q4",
    label: "Tax filing — Q4 deadline approaching",
    status: "pending",
    dueInDays: 14,
    category: "Business compliance",
  });

  const complete = items.filter((i) => i.status === "complete").length;
  const score = items.length ? Math.round((complete / items.length) * 100) : 0;

  return { items, score, alerts: items.filter((i) => i.status !== "complete").slice(0, 5) };
}

async function handleMarketResearch(
  profile: Record<string, unknown>,
  body: Record<string, unknown>,
) {
  const query = String(body?.query ?? body?.topic ?? "").trim() ||
    "Canadian SMB grant and funding landscape";
  const industry = String(profile.industry ?? "general business");
  const location = String(profile.location ?? "Canada");

  const system = `You are RTM Grant OS market research assistant for Canadian SMBs.
Respond in JSON only with keys: summary (string), trends (array of {title, change, direction up|down|stable}),
competitors (array of {name, share, trend up|down|stable}), segments (array of {name, size, growth}),
opportunities (array of {title, description, potential High|Medium|Low}).
Base advice on public knowledge; do not invent specific dollar guarantees.`;

  const userMsg = `Research request: ${query}
Business industry: ${industry}
Location: ${location}
Funding goal: ${profile.fundingGoal ?? "not specified"}`;

  const { text } = await openRouterChat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMsg },
    ],
    maxTokens: 900,
    temperature: 0.5,
    httpReferer: "https://grants.rtmbusinessdirectory.com",
    xTitle: "RTM Grant OS Market Research",
  });

  let parsed: Record<string, unknown> = {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch {
    parsed = { summary: text };
  }

  return { ...parsed, raw: text, aiConfigured: true };
}

async function handleGenerateReport(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
  profile: Record<string, unknown>,
  body: Record<string, unknown>,
) {
  const reportType = String(body?.reportType ?? "grant_summary");
  const analytics = await handleAnalytics(admin, userId);
  const compliance = await handleCompliance(admin, userId, profile);

  const sections = [
    `# RTM Grant OS Report`,
    `**Type:** ${reportType}`,
    `**Generated:** ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `## Profile`,
    `- Business: ${profile.businessName ?? "—"}`,
    `- Industry: ${profile.industry ?? "—"}`,
    `- Location: ${profile.location ?? "—"}`,
    `- Profile completion: ${analytics.profileComplete}%`,
    ``,
    `## Pipeline`,
    `- Exploring: ${analytics.pipeline.exploring}`,
    `- In review: ${analytics.pipeline.inProgress}`,
    `- Submitted: ${analytics.pipeline.submitted}`,
    `- Approved: ${analytics.pipeline.approved}`,
    ``,
    `## Compliance score: ${compliance.score}%`,
    ...(compliance.items as Array<{ label: string; status: string }>)
      .filter((i) => i.status !== "complete")
      .slice(0, 8)
      .map((i) => `- [ ] ${i.label}`),
    ``,
    `## Insights`,
    ...analytics.insights.map((line: string) => `- ${line}`),
  ];

  const markdown = sections.join("\n");

  let aiSummary = "";
  try {
    const { text } = await openRouterChat({
      messages: [
        {
          role: "system",
          content:
            "Summarize this grant readiness report in 3 bullet points for a Canadian business owner. Be factual, no guarantees.",
        },
        { role: "user", content: markdown.slice(0, 4000) },
      ],
      maxTokens: 350,
      temperature: 0.3,
      httpReferer: "https://grants.rtmbusinessdirectory.com",
      xTitle: "RTM Grant OS Report",
    });
    aiSummary = text;
  } catch {
    aiSummary = analytics.insights.join(" ");
  }

  return {
    title: `Grant OS ${reportType.replace(/_/g, " ")} — ${new Date().toLocaleDateString("en-CA")}`,
    markdown,
    aiSummary,
    analytics,
    complianceScore: compliance.score,
  };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnon) {
      return jsonResponse(req, { error: "Server configuration incomplete." }, 500);
    }

    const userId = await resolveUserId(req, supabaseUrl, supabaseAnon);
    if (!userId) {
      return jsonResponse(req, { error: "Sign in required.", code: "unauthorized" }, 401);
    }

    const admin = createServiceClient();
    const rate = await enforceHourlyRateLimit(admin, `grant-tools:${userId}`, AUTH_LIMIT);
    if (!rate.allowed) {
      return jsonResponse(
        req,
        {
          error: "Tool limit reached. Try again in an hour.",
          code: "rate_limit_exceeded",
          retryAfter: rate.retryAfterSeconds,
        },
        429,
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as ToolAction;
    if (
      !action ||
      !["analytics", "find_customers", "compliance", "market_research", "generate_report"]
        .includes(action)
    ) {
      return jsonResponse(req, { error: "Invalid action." }, 400);
    }

    const profile = await loadGrantProfile(admin, userId);

    let result: unknown;
    switch (action) {
      case "analytics":
        result = await handleAnalytics(admin, userId);
        break;
      case "find_customers":
        result = await handleFindCustomers(admin, body, profile);
        break;
      case "compliance":
        result = await handleCompliance(admin, userId, profile);
        break;
      case "market_research":
        result = await handleMarketResearch(profile, body);
        break;
      case "generate_report":
        result = await handleGenerateReport(admin, userId, profile, body);
        break;
    }

    return jsonResponse(req, { success: true, action, data: result, remaining: rate.remaining });
  } catch (error) {
    if (error instanceof AssistantError) {
      const status = error.code === "OPENROUTER_NOT_CONFIGURED" ? 503 : 502;
      return jsonResponse(req, { error: error.message, code: error.code }, status);
    }
    console.error("grant-os-tools:", error);
    const message = error instanceof Error ? error.message : "Tool request failed";
    return jsonResponse(req, { error: message }, 500);
  }
});
