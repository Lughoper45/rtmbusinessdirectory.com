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
};

export type GrantProfile = {
  industry?: string;
  location?: string;
  employeeCount?: string;
  revenueRange?: string;
  growthStage?: string;
};

export type ScoredGrant = GrantRecord & {
  computedMatch: number;
  readyPercentage: number;
  requirementsStatus: { label: string; met: boolean }[];
};
