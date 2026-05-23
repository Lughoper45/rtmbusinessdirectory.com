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

type Action = "analyze_readiness" | "generate_draft" | "list_missing";

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
      .select("id, required_fields, required_documents")
      .eq("id", resolvedGrantId)
      .maybeSingle(),
    kajwpAdmin
      .from("grant_profiles")
      .select("profile")
      .eq("user_id", intake.user_id)
      .maybeSingle(),
    kajwpAdmin
      .from("grant_intake_answers")
      .select("field_key, value")
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
    requiredFields: parseRequirements(grant.required_fields),
    requiredDocuments: parseRequirements(grant.required_documents),
    profile: (profileRow?.profile ?? null) as Record<string, unknown> | null,
    answers: answers ?? [],
    documents: documents ?? [],
  };
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

    if (!action || !["analyze_readiness", "generate_draft", "list_missing"].includes(action)) {
      return jsonResponse(
        req,
        { error: "Invalid action. Use analyze_readiness, list_missing, or generate_draft." },
        400,
      );
    }

    if (action === "generate_draft") {
      return jsonResponse(
        req,
        {
          error: "Application Assistant draft generation is not available yet (Phase 2).",
          phase: 2,
        },
        501,
      );
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
    const message = error instanceof Error ? error.message : "Intake assistant failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Intake not found" || message === "Grant not found"
            ? 404
            : 500;
    return jsonResponse(req, { error: message }, status);
  }
});
