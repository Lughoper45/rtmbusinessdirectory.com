import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRANT_KEYWORDS =
  /\b(grant|grants|funding|fund|subsidy|loan program|financing|canexport|irap|csbfp|sred|sr&ed|qualify|eligible|eligibility)\b/i;
const BUSINESS_KEYWORDS =
  /\b(find|search|looking for|recommend|near me|business|restaurant|plumber|contractor|lawyer|dentist|mechanic|shop|store|service)\b/i;

const CANADIAN_CITIES = [
  "toronto",
  "vancouver",
  "montreal",
  "calgary",
  "edmonton",
  "ottawa",
  "winnipeg",
  "hamilton",
  "kitchener",
  "london",
  "halifax",
  "victoria",
  "saskatoon",
  "regina",
  "brampton",
  "mississauga",
  "markham",
  "scarborough",
  "north york",
];

const CANADIAN_PROVINCES: Record<string, string> = {
  ontario: "ON",
  on: "ON",
  alberta: "AB",
  ab: "AB",
  "british columbia": "BC",
  bc: "BC",
  quebec: "QC",
  qc: "QC",
  manitoba: "MB",
  mb: "MB",
  saskatchewan: "SK",
  sk: "SK",
  "nova scotia": "NS",
  ns: "NS",
  "new brunswick": "NB",
  nb: "NB",
  newfoundland: "NL",
  nl: "NL",
};

function extractSearchTerms(message: string): {
  city?: string;
  province?: string;
  category?: string;
  wantsGrants: boolean;
  wantsBusinesses: boolean;
} {
  const lower = message.toLowerCase();
  const wantsGrants = GRANT_KEYWORDS.test(lower);
  const wantsBusinesses = BUSINESS_KEYWORDS.test(lower);

  let city: string | undefined;
  for (const c of CANADIAN_CITIES) {
    if (lower.includes(c)) {
      city = c;
      break;
    }
  }

  let province: string | undefined;
  for (const [name, code] of Object.entries(CANADIAN_PROVINCES)) {
    if (lower.includes(name)) {
      province = code;
      break;
    }
  }

  const categoryMatch = lower.match(
    /\b(plumber|plumbing|restaurant|lawyer|attorney|dentist|mechanic|electrician|hvac|contractor|accountant|insurance|hotel|spa|salon|bakery|cafe)\b/,
  );
  const category = categoryMatch?.[1];

  return { city, province, category, wantsGrants, wantsBusinesses };
}

async function queryBusinesses(
  admin: SupabaseClient,
  message: string,
): Promise<string> {
  const { city, province, category, wantsBusinesses } = extractSearchTerms(message);
  if (!wantsBusinesses && !city && !category) return "";

  let query = admin
    .from("businesses")
    .select("name, category, city, province, rating, website")
    .limit(5);

  if (city) query = query.ilike("city", `%${city}%`);
  if (province) query = query.ilike("province", `%${province}%`);
  if (category) {
    query = query.or(`category.ilike.%${category}%,name.ilike.%${category}%`);
  } else if (!city && !province) {
    const tokens = message.split(/\s+/).filter((t) => t.length > 3).slice(0, 3);
    if (tokens.length > 0) {
      const orParts = tokens.map((t) => `name.ilike.%${t}%,category.ilike.%${t}%`);
      query = query.or(orParts.join(","));
    }
  }

  const { data, error } = await query.order("rating", { ascending: false });
  if (error || !data?.length) return "";

  const lines = data.map(
    (b) =>
      `- ${b.name} (${b.category}, ${b.city}, ${b.province})${b.rating ? ` — ${b.rating}/5` : ""}${b.website ? ` — ${b.website}` : ""}`,
  );
  return `Matching directory businesses (from RTM database):\n${lines.join("\n")}`;
}

async function queryGrants(
  admin: SupabaseClient,
  message: string,
  profile?: Record<string, unknown>,
): Promise<string> {
  const { wantsGrants } = extractSearchTerms(message);
  if (!wantsGrants) return "";

  const stopWords = new Set([
    "show", "what", "which", "grants", "grant", "qualify", "eligible", "eligibility",
    "for", "that", "with", "from", "have", "help", "find", "need", "want", "please",
  ]);

  const tokens = message
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/g, ""))
    .filter((t) => t.length > 2 && !stopWords.has(t) && !GRANT_KEYWORDS.test(t))
    .slice(0, 4);

  if (profile?.industry && typeof profile.industry === "string") {
    tokens.unshift(profile.industry.toLowerCase().split(/\s+/)[0] ?? "");
  }

  let query = admin
    .from("grants")
    .select("id, name, organization, amount, eligibility_summary, official_url, provinces, sectors")
    .eq("is_active", true)
    .limit(8);

  const province =
    typeof profile?.location === "string"
      ? profile.location
      : typeof profile?.province === "string"
        ? profile.province
        : undefined;

  if (tokens.length > 0) {
    const orParts = tokens.flatMap((t) => [
      `name.ilike.%${t}%`,
      `description.ilike.%${t}%`,
      `organization.ilike.%${t}%`,
      `eligibility_summary.ilike.%${t}%`,
    ]);
    query = query.or(orParts.join(","));
  }

  const { data, error } = await query.order("name");
  if (error || !data?.length) {
    const { data: fallback } = await admin
      .from("grants")
      .select("id, name, organization, amount, eligibility_summary, official_url")
      .eq("is_active", true)
      .order("name")
      .limit(8);
    if (!fallback?.length) return "";
    return formatGrantLines(fallback, profile, province);
  }

  return formatGrantLines(data, profile, province);
}

function formatGrantLines(
  grants: Array<{
    id: string;
    name: string;
    organization: string;
    amount: number | null;
    eligibility_summary: string | null;
    official_url?: string | null;
  }>,
  profile?: Record<string, unknown>,
  province?: string,
): string {
  const profileHint = profile
    ? `Profile context: ${JSON.stringify(profile)}${province ? ` (${province})` : ""}.`
    : "";

  const lines = grants.map((g) => {
    const amount = g.amount ? `$${Number(g.amount).toLocaleString()}` : "Amount varies";
    const summary = g.eligibility_summary
      ? ` — ${String(g.eligibility_summary).slice(0, 140)}`
      : "";
    const url = g.official_url ? ` [${g.id}]` : "";
    return `- ${g.name} (${g.organization}, ${amount})${summary}${url}`;
  });

  return `${profileHint}\nMatching grant programs (from RTM catalog — list these by name; advisor confirms final eligibility):\n${lines.join("\n")}`;
}

export async function buildLiveContextBlock(
  admin: SupabaseClient,
  lastUserMessage: string,
  profile?: Record<string, unknown>,
): Promise<string> {
  const [businesses, grants] = await Promise.all([
    queryBusinesses(admin, lastUserMessage),
    queryGrants(admin, lastUserMessage, profile),
  ]);

  const parts = [businesses, grants].filter(Boolean);
  if (parts.length === 0) return "";
  return `\n\nLive catalog context (cite when helpful; do not invent programs not listed):\n${parts.join("\n\n")}`;
}

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server configuration incomplete.");
  return createClient(url, key);
}
