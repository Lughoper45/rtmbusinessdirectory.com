export type GrantRecord = {
  id: string;
  name: string;
  organization: string;
  amount: number;
  match_score: number | null;
  deadline_days: number | null;
  difficulty: string | null;
  type: string | null;
  requirements: string[] | null;
  approval_rate: number | null;
  description: string | null;
  official_url: string | null;
  deadline_label: string | null;
  sectors: string[] | null;
  provinces: string[] | null;
  is_active: boolean | null;
  eligibility_summary: string | null;
  application_steps: string[] | null;
  funding_notes: string | null;
  org?: string | null;
  category?: string | null;
  subcategory?: string | null;
  level?: string | null;
  province?: string | null;
  funding_type?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  amount_label?: string | null;
  designations?: string[] | null;
  business_stages?: string[] | null;
  min_years_operating?: number | null;
  min_employees?: number | null;
  max_employees?: number | null;
  min_revenue?: number | null;
  max_revenue?: number | null;
  application_hours_estimate?: number | null;
  deadline_type?: string | null;
  intake_open?: boolean | null;
  is_repayable?: boolean | null;
  stacking_allowed?: boolean | null;
  match_required?: boolean | null;
  match_percent?: number | null;
  tags?: string[] | null;
  rtm_processing_eligible?: boolean | null;
  required_fields?: GrantRequirementItem[] | null;
  required_documents?: GrantRequirementItem[] | null;
};

export type GrantProfile = {
  industry?: string;
  location?: string;
  employeeCount?: string;
  revenueRange?: string;
  growthStage?: string;
};

export type GrantRequirementItem = {
  key: string;
  label: string;
  required?: boolean;
  weight?: number;
};

export type ScoredGrant = GrantRecord & {
  computedMatch: number;
  readyPercentage: number;
  requirementsStatus: { label: string; met: boolean }[];
};
