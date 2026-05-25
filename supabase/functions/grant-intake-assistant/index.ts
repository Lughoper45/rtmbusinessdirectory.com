import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";
import {
  analyzeReadinessRules,
  listMissingRules,
  type GrantRequirementItem,
} from "../_shared/grantIntakeRules.ts";
import {
  AssistantError,
  isOpenRouterConfigured,
  openRouterChat,
} from "../_shared/openrouter.ts";

type Action = "analyze_readiness" | "generate_draft" | "list_missing";

/** Narrative fields supported by Application Assistant generate_draft */
const DRAFT_FIELD_KEYS = new Set([
  "project_summary",
  "use_of_funds",
  "business_description",
  "objectives",
  "budget_notes",
]);

const DRAFT_FIELD_LABELS: Record<string, string> = {
  project_summary: "Project or funding purpose summary",
  use_of_funds: "Use of funds",
  business_description: "Business description",
  objectives: "Project objectives and outcomes",
  budget_notes: "Budget notes and financial assumptions",
};

const MAX_DRAFTS_PER_HOUR = 12;

async function requireUser(
  req: Request,
  kajwpUrl: string,
  kajwpAnon: string,
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");

  const authClient = createClient(kajwpUrl, kajwpAnon);
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

async function requireAdmin(
  kajwpAdmin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: profile } = await kajwpAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.role === "admin") return true;

  const { data: isAdmin } = await kajwpAdmin.rpc("is_admin", {
    check_user_id: userId,
  });
  return isAdmin === true;
}

function parseRequirements(raw: unknown): GrantRequirementItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is GrantRequirementItem => typeof item?.key === "string")
    .map((item) => ({
      key: item.key,
      label: item.label ?? item.key,
      required: item.required !== false,
      weight: Math.max(1, item.weight ?? 1),
    }));
}

async function loadIntakeContext(
  kajwpAdmin: ReturnType<typeof createClient>,
  intakeId: string,
  grantId?: string,
) {
  const { data: intake, error: intakeError } = await kajwpAdmin
    .from("grant_intakes")
    .select("id, user_id, grant_id, package_id, status")
    .eq("id", intakeId)
    .maybeSingle();

  if (intakeError) throw intakeError;
  if (!intake) throw new Error("Intake not found");

  const resolvedGrantId = grantId ?? intake.grant_id;

  const [
    { data: grant, error: grantError },
    { data: profileRow },
    { data: answers },
    { data: documents },
  ] = await Promise.all([
    kajwpAdmin
      .from("grants")
      .select(
        "id, name, organization, description, eligibility_summary, requirements, required_fields, required_documents",
      )
      .eq("id", resolvedGrantId)
      .maybeSingle(),
    kajwpAdmin
      .from("grant_profiles")
      .select("profile")
      .eq("user_id", intake.user_id)
      .maybeSingle(),
    kajwpAdmin
      .from("grant_intake_answers")
      .select("field_key, value, source")
      .eq("intake_id", intakeId),
    kajwpAdmin
      .from("grant_documents")
      .select("document_type, status")
      .eq("intake_id", intakeId),
  ]);

  if (grantError) throw grantError;
  if (!grant) throw new Error("Grant not found");

  return {
    intake,
    grant,
    requiredFields: parseRequirements(grant.required_fields),
    requiredDocuments: parseRequirements(grant.required_documents),
    profile: (profileRow?.profile ?? null) as Record<string, unknown> | null,
    answers: answers ?? [],
    documents: documents ?? [],
  };
}

function formatContextForDraft(ctx: Awaited<ReturnType<typeof loadIntakeContext>>): string {
  const lines: string[] = [];
  lines.push(`Grant: ${ctx.grant.name}`);
  if (ctx.grant.organization) lines.push(`Program administrator: ${ctx.grant.organization}`);
  if (ctx.grant.eligibility_summary) {
    lines.push(`Eligibility: ${ctx.grant.eligibility_summary}`);
  }
  if (ctx.grant.description) lines.push(`Program description: ${ctx.grant.description}`);

  if (ctx.profile && Object.keys(ctx.profile).length) {
    lines.push("\nMember profile:");
    lines.push(JSON.stringify(ctx.profile, null, 0));
  }

  const answerLines = ctx.answers
    .filter((a) => a.value != null && String(a.value).length > 2)
    .map((a) => `- ${a.field_key}: ${typeof a.value === "string" ? a.value : JSON.stringify(a.value)}`);

  if (answerLines.length) {
    lines.push("\nIntake answers so far:");
    lines.push(answerLines.join("\n"));
  }

  return lines.join("\n");
}

async function enforceDraftRateLimit(
  kajwpAdmin: ReturnType<typeof createClient>,
  intakeId: string,
  userId: string,
) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await kajwpAdmin
    .from("grant_intake_answers")
    .select("id", { count: "exact", head: true })
    .eq("intake_id", intakeId)
    .eq("source", "ai_suggested")
    .gte("updated_at", since);

  if (error) throw error;
  if ((count ?? 0) >= MAX_DRAFTS_PER_HOUR) {
    throw new Error("Draft limit reached. Try again in an hour or edit fields manually.");
  }

  void userId;
}

async function generateDraftForField(
  ctx: Awaited<ReturnType<typeof loadIntakeContext>>,
  fieldKey: string,
): Promise<string> {
  const label = DRAFT_FIELD_LABELS[fieldKey] ?? fieldKey;
  const contextBlock = formatContextForDraft(ctx);

  const system = `You are the RTM Application Assistant helping a Canadian business prepare a grant application.
Write factual, professional prose for the "${label}" section. Use only information from the context; do not invent revenue, headcount, or amounts not provided.
If data is missing, use neutral placeholders like "[amount to confirm]" rather than fabricating numbers.
Output plain text only (no markdown code fences). Target 120–220 words unless the field is budget_notes (shorter bullet-style is OK).`;

  const user = `${contextBlock}

---
Write the "${label}" section for this grant application. Field key: ${fieldKey}.`;

  const { text } = await openRouterChat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens: 700,
    temperature: 0.35,
  });

  return text;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const kajwpUrl = Deno.env.get("SUPABASE_URL");
    const kajwpService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const kajwpAnon = Deno.env.get("SUPABASE_ANON_KEY");

    if (!kajwpUrl || !kajwpService || !kajwpAnon) {
      return jsonResponse(req, { error: "Server configuration incomplete." }, 500);
    }

    const user = await requireUser(req, kajwpUrl, kajwpAnon);
    const body = await req.json().catch(() => ({}));
    const action = body?.action as Action | undefined;
    const intakeId = body?.intake_id ? String(body.intake_id) : "";
    const grantId = body?.grant_id ? String(body.grant_id) : undefined;
    const fieldKey = body?.field_key ? String(body.field_key) : "";

    if (!action || !["analyze_readiness", "generate_draft", "list_missing"].includes(action)) {
      return jsonResponse(
        req,
        { error: "Invalid action. Use analyze_readiness, list_missing, or generate_draft." },
        400,
      );
    }

    if (action === "generate_draft") {
      if (!isOpenRouterConfigured()) {
        return jsonResponse(
          req,
          {
            error:
              "Application Assistant not configured. Set OPENROUTER_API_KEY on kajwp.",
            code: "OPENROUTER_NOT_CONFIGURED",
          },
          502,
        );
      }

      if (!intakeId) {
        return jsonResponse(req, { error: "intake_id is required." }, 400);
      }
      if (!fieldKey || !DRAFT_FIELD_KEYS.has(fieldKey)) {
        return jsonResponse(
          req,
          {
            error:
              "field_key is required. Use project_summary, use_of_funds, business_description, objectives, or budget_notes.",
          },
          400,
        );
      }

      const kajwpAdmin = createClient(kajwpUrl, kajwpService);
      const ctx = await loadIntakeContext(kajwpAdmin, intakeId, grantId);

      const isOwner = ctx.intake.user_id === user.id;
      const isAdmin = await requireAdmin(kajwpAdmin, user.id);
      if (!isOwner && !isAdmin) {
        return jsonResponse(req, { error: "Forbidden" }, 403);
      }

      await enforceDraftRateLimit(kajwpAdmin, intakeId, user.id);

      const draft = await generateDraftForField(ctx, fieldKey);

      const { error: upsertError } = await kajwpAdmin
        .from("grant_intake_answers")
        .upsert(
          {
            intake_id: intakeId,
            field_key: fieldKey,
            value: draft,
            source: "ai_suggested",
          },
          { onConflict: "intake_id,field_key" },
        );

      if (upsertError) throw upsertError;

      return jsonResponse(req, {
        intake_id: intakeId,
        field_key: fieldKey,
        draft,
        source: "ai_suggested",
        assistant: "Application Assistant",
        disclaimer:
          "Review and edit this draft before submitting. RTM does not submit applications on your behalf.",
      });
    }

    if (!intakeId) {
      return jsonResponse(req, { error: "intake_id is required." }, 400);
    }

    const kajwpAdmin = createClient(kajwpUrl, kajwpService);
    const ctx = await loadIntakeContext(kajwpAdmin, intakeId, grantId);

    const isOwner = ctx.intake.user_id === user.id;
    const isAdmin = await requireAdmin(kajwpAdmin, user.id);
    if (!isOwner && !isAdmin) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    const rulesInput = {
      requiredFields: ctx.requiredFields,
      requiredDocuments: ctx.requiredDocuments,
      profile: ctx.profile,
      answers: ctx.answers,
      documents: ctx.documents,
    };

    if (action === "list_missing") {
      const missing = listMissingRules(rulesInput);
      return jsonResponse(req, {
        intake_id: intakeId,
        missing_fields: missing.fields,
        missing_documents: missing.documents,
      });
    }

    const result = analyzeReadinessRules(rulesInput);

    const { data: checkRow, error: checkError } = await kajwpAdmin
      .from("grant_readiness_checks")
      .insert({
        intake_id: intakeId,
        check_type: "rules",
        score: result.score,
        status: result.status,
        details: result.details,
      })
      .select("id, created_at")
      .single();

    if (checkError) throw checkError;

    const nextIntakeStatus =
      result.status === "ready" || result.status === "mostly_ready"
        ? "ready_for_review"
        : "collecting";

    const { error: intakeUpdateError } = await kajwpAdmin
      .from("grant_intakes")
      .update({
        readiness_score: result.score,
        readiness_status: result.status,
        status: nextIntakeStatus,
      })
      .eq("id", intakeId);

    if (intakeUpdateError) throw intakeUpdateError;

    return jsonResponse(req, {
      intake_id: intakeId,
      score: result.score,
      status: result.status,
      details: result.details,
      check_id: checkRow.id,
      checked_at: checkRow.created_at,
      assistant: "Application Assistant",
    });
  } catch (error) {
    if (error instanceof AssistantError) {
      return jsonResponse(
        req,
        { error: error.message, code: error.code },
        502,
      );
    }

    const message = error instanceof Error ? error.message : "Intake assistant failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Intake not found" || message === "Grant not found"
            ? 404
            : message.includes("Draft limit")
              ? 429
              : 500;

    const code =
      message.includes("Draft limit")
        ? "DRAFT_RATE_LIMIT"
        : status === 401
          ? "UNAUTHORIZED"
          : status === 403
            ? "FORBIDDEN"
            : status === 404
              ? "NOT_FOUND"
              : "INTAKE_ASSISTANT_ERROR";

    return jsonResponse(req, { error: message, code }, status);
  }
});
