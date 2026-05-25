/** LaunchBot guided workflows — actions returned alongside chat replies. */

export type LaunchBotActionId =
  | "auth_sign_in"
  | "auth_sign_up"
  | "membership_checkout"
  | "profile_wizard"
  | "open_grants"
  | "grant_intake_start"
  | "grant_package_checkout"
  | "list_business"
  | "contact_advisor"
  | "open_url";

export type LaunchBotAction = {
  id: LaunchBotActionId;
  label: string;
  style: "primary" | "secondary" | "outline";
  requires_auth?: boolean;
  payload?: {
    grant_id?: string;
    package_id?: string;
    href?: string;
  };
};

export type WorkflowStep = {
  id: string;
  label: string;
};

export type LaunchBotWorkflow = {
  id: "grant_journey" | "membership_journey";
  title: string;
  steps: WorkflowStep[];
  current_step: number;
  current_step_id: string;
};

export type UserLaunchContext = {
  signed_in: boolean;
  membership_active: boolean;
  profile_complete: boolean;
  has_open_intake: boolean;
  intake_has_package: boolean;
  suggested_grant_id?: string;
};

const GRANT_JOURNEY_STEPS: WorkflowStep[] = [
  { id: "sign_in", label: "Sign in" },
  { id: "profile", label: "Profile" },
  { id: "explore", label: "Grants" },
  { id: "intake", label: "Intake" },
  { id: "package", label: "Package" },
  { id: "advisor", label: "Advisor" },
];

const MEMBERSHIP_JOURNEY_STEPS: WorkflowStep[] = [
  { id: "sign_up", label: "Account" },
  { id: "membership", label: "Membership" },
  { id: "profile", label: "Profile" },
  { id: "grants", label: "Grants" },
];

function messageIntent(message: string): "grant" | "membership" | "general" {
  const lower = message.toLowerCase();
  if (/\b(membership|member|join rtm|register|sign up|signup|pay|subscribe|\$100)\b/.test(lower)) {
    return "membership";
  }
  if (/\b(grant|grants|qualify|eligible|intake|apply|funding|package|true north|northern star)\b/.test(lower)) {
    return "grant";
  }
  return "general";
}

function grantStepIndex(ctx: UserLaunchContext): number {
  if (!ctx.signed_in) return 0;
  if (!ctx.profile_complete) return 1;
  if (!ctx.has_open_intake) return 2;
  if (ctx.intake_has_package) return 5;
  if (ctx.has_open_intake) return 3;
  return 4;
}

function membershipStepIndex(ctx: UserLaunchContext): number {
  if (!ctx.signed_in) return 0;
  if (!ctx.membership_active) return 1;
  if (!ctx.profile_complete) return 2;
  return 3;
}

function actionsForGrantStep(stepId: string, ctx: UserLaunchContext): LaunchBotAction[] {
  switch (stepId) {
    case "sign_in":
      return [
        { id: "auth_sign_in", label: "Sign in to RTM", style: "primary" },
        { id: "auth_sign_up", label: "Create account", style: "outline" },
      ];
    case "profile":
      return [
        { id: "profile_wizard", label: "Complete grant profile", style: "primary" },
      ];
    case "explore":
      return [
        { id: "open_grants", label: "Browse grant catalog", style: "primary" },
      ];
    case "intake":
      return [
        {
          id: "grant_intake_start",
          label: "Start grant intake",
          style: "primary",
          requires_auth: true,
          payload: ctx.suggested_grant_id ? { grant_id: ctx.suggested_grant_id } : undefined,
        },
      ];
    case "package":
      return [
        {
          id: "grant_package_checkout",
          label: "True North Standard — from $1,000",
          style: "primary",
          requires_auth: true,
          payload: { package_id: "true-north-standard", grant_id: ctx.suggested_grant_id },
        },
        {
          id: "grant_package_checkout",
          label: "Northern Star — from $3,250",
          style: "secondary",
          requires_auth: true,
          payload: { package_id: "northern-star", grant_id: ctx.suggested_grant_id },
        },
      ];
    default:
      return [
        { id: "contact_advisor", label: "Talk to RTM advisor", style: "primary" },
      ];
  }
}

function actionsForMembershipStep(stepId: string): LaunchBotAction[] {
  switch (stepId) {
    case "sign_up":
      return [
        { id: "auth_sign_up", label: "Create RTM account", style: "primary" },
        { id: "auth_sign_in", label: "Sign in", style: "outline" },
      ];
    case "membership":
      return [
        { id: "membership_checkout", label: "Join RTM — $100/year", style: "primary" },
      ];
    case "profile":
      return [
        { id: "profile_wizard", label: "Set up grant profile", style: "primary" },
      ];
    default:
      return [
        { id: "open_grants", label: "Open GrantPilot", style: "primary" },
      ];
  }
}

export function resolveLaunchBotWorkflow(
  lastMessage: string,
  ctx: UserLaunchContext,
): { workflow: LaunchBotWorkflow | null; actions: LaunchBotAction[] } {
  const intent = messageIntent(lastMessage);

  if (intent === "grant" || (intent === "general" && ctx.signed_in && ctx.profile_complete)) {
    let idx = grantStepIndex(ctx);
    if (
      /\b(process|processing|package|advisor|true north|northern star)\b/i.test(lastMessage) &&
      ctx.profile_complete &&
      !ctx.has_open_intake
    ) {
      idx = 4;
    }
    const step = GRANT_JOURNEY_STEPS[idx] ?? GRANT_JOURNEY_STEPS[0];
    return {
      workflow: {
        id: "grant_journey",
        title: "Grant journey with RTM",
        steps: GRANT_JOURNEY_STEPS,
        current_step: idx,
        current_step_id: step.id,
      },
      actions: actionsForGrantStep(step.id, ctx),
    };
  }

  if (intent === "membership") {
    const idx = membershipStepIndex(ctx);
    const step = MEMBERSHIP_JOURNEY_STEPS[idx] ?? MEMBERSHIP_JOURNEY_STEPS[0];
    return {
      workflow: {
        id: "membership_journey",
        title: "RTM membership",
        steps: MEMBERSHIP_JOURNEY_STEPS,
        current_step: idx,
        current_step_id: step.id,
      },
      actions: actionsForMembershipStep(step.id),
    };
  }

  if (!ctx.signed_in) {
    return {
      workflow: null,
      actions: [
        { id: "open_grants", label: "Browse grants", style: "secondary" },
        { id: "auth_sign_in", label: "Sign in", style: "outline" },
      ],
    };
  }

  return {
    workflow: null,
    actions: [
      { id: "open_grants", label: "Grant catalog", style: "secondary" },
      { id: "profile_wizard", label: "Update profile", style: "outline" },
    ],
  };
}

export async function loadUserLaunchContext(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2").createClient>,
  userId: string | null,
  lastMessage: string,
): Promise<UserLaunchContext> {
  if (!userId) {
    return {
      signed_in: false,
      membership_active: false,
      profile_complete: false,
      has_open_intake: false,
      intake_has_package: false,
    };
  }

  const [{ data: profileRow }, { data: grantProfile }, { data: intakes }] = await Promise.all([
    admin.from("profiles").select("membership_status").eq("user_id", userId).maybeSingle(),
    admin.from("grant_profiles").select("profile").eq("user_id", userId).maybeSingle(),
    admin
      .from("grant_intakes")
      .select("id, grant_id, status, package_id")
      .eq("user_id", userId)
      .in("status", ["draft", "collecting", "ready_for_review", "with_advisor"])
      .limit(1),
  ]);

  const p = grantProfile?.profile as Record<string, unknown> | undefined;
  const coreFields = ["industry", "location", "employeeCount", "revenueRange", "growthStage"];
  const filled = p ? coreFields.filter((k) => Boolean(p[k])).length : 0;
  const profile_complete = filled >= 3;

  const openIntake = intakes?.[0];
  let suggested_grant_id = openIntake?.grant_id as string | undefined;

  if (!suggested_grant_id && /\b(grant|fund|qualify)\b/i.test(lastMessage)) {
    const { data: topGrant } = await admin
      .from("grants")
      .select("id")
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .maybeSingle();
    suggested_grant_id = topGrant?.id;
  }

  return {
    signed_in: true,
    membership_active: profileRow?.membership_status === "active",
    profile_complete,
    has_open_intake: Boolean(openIntake),
    intake_has_package: Boolean(openIntake?.package_id),
    suggested_grant_id,
  };
}
