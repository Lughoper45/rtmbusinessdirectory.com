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

export type LaunchBotMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  actions?: LaunchBotAction[];
  workflow?: LaunchBotWorkflow | null;
};
