import type { GrantProfile } from "@/types/grant";
import { provinceFromLocation } from "@/lib/grantProfile";

/** Canonical intake field keys — align with grants.required_fields seed. */
export const GrantIntakeFieldKey = {
  BusinessName: "business_name",
  LegalStructure: "legal_structure",
  Province: "province",
  Industry: "industry",
  EmployeeCount: "employee_count",
  RevenueRange: "revenue_range",
  ProjectSummary: "project_summary",
  FundingAmountRequested: "funding_amount_requested",
  GrowthStage: "growth_stage",
  ExportMarkets: "export_markets",
  WomenOwned: "women_owned",
} as const;

export type GrantIntakeFieldKey =
  (typeof GrantIntakeFieldKey)[keyof typeof GrantIntakeFieldKey];

/** Canonical document types — align with grants.required_documents seed. */
export const GrantDocumentType = {
  BusinessRegistration: "business_registration",
  FinancialStatements: "financial_statements",
  BusinessPlan: "business_plan",
  TaxReturns: "tax_returns",
  ProjectBudget: "project_budget",
  OwnerResume: "owner_resume",
  ExportPlan: "export_plan",
  ProvincialRegistration: "provincial_registration",
} as const;

export type GrantDocumentType =
  (typeof GrantDocumentType)[keyof typeof GrantDocumentType];

export type GrantRequirementItem = {
  key: string;
  label: string;
  required?: boolean;
  weight?: number;
};

export type GrantIntakeStatus =
  | "draft"
  | "collecting"
  | "ready_for_review"
  | "with_advisor"
  | "submitted_externally"
  | "closed";

export type ReadinessStatus =
  | "not_ready"
  | "partially_ready"
  | "mostly_ready"
  | "ready";

export type GrantIntakeAnswer = {
  field_key: string;
  value: unknown;
  source?: "profile" | "user_input" | "ai_suggested" | "advisor";
};

export type GrantDocumentRecord = {
  document_type: string;
  status: "missing" | "uploaded" | "verified" | "rejected";
};

export type ReadinessDetails = {
  missingFields: GrantRequirementItem[];
  missingDocuments: GrantRequirementItem[];
  profileGaps: GrantRequirementItem[];
  blockers: string[];
  profilePct: number;
  answersPct: number;
  documentsPct: number;
  optionalBonus: number;
};

export type ReadinessResult = {
  score: number;
  status: ReadinessStatus;
  details: ReadinessDetails;
  meetsPackageThreshold: boolean;
};

const PROFILE_FIELD_KEYS = new Set<string>([
  GrantIntakeFieldKey.Industry,
  GrantIntakeFieldKey.Province,
  GrantIntakeFieldKey.EmployeeCount,
  GrantIntakeFieldKey.RevenueRange,
  GrantIntakeFieldKey.GrowthStage,
]);

const DEFAULT_REQUIRED_FIELDS: GrantRequirementItem[] = [
  { key: GrantIntakeFieldKey.BusinessName, label: "Legal business name", required: true, weight: 2 },
  { key: GrantIntakeFieldKey.LegalStructure, label: "Legal structure", required: true, weight: 1 },
  { key: GrantIntakeFieldKey.Province, label: "Primary province", required: true, weight: 2 },
  { key: GrantIntakeFieldKey.Industry, label: "Industry or sector", required: true, weight: 1 },
  { key: GrantIntakeFieldKey.EmployeeCount, label: "Number of employees", required: true, weight: 1 },
  { key: GrantIntakeFieldKey.RevenueRange, label: "Annual revenue range", required: true, weight: 1 },
  { key: GrantIntakeFieldKey.ProjectSummary, label: "Project summary", required: true, weight: 2 },
  { key: GrantIntakeFieldKey.FundingAmountRequested, label: "Funding amount requested", required: false, weight: 1 },
];

const DEFAULT_REQUIRED_DOCUMENTS: GrantRequirementItem[] = [
  { key: GrantDocumentType.BusinessRegistration, label: "Business registration", required: true, weight: 2 },
  { key: GrantDocumentType.FinancialStatements, label: "Financial statements", required: true, weight: 2 },
  { key: GrantDocumentType.BusinessPlan, label: "Business plan", required: true, weight: 1 },
  { key: GrantDocumentType.TaxReturns, label: "Tax returns", required: false, weight: 1 },
  { key: GrantDocumentType.ProjectBudget, label: "Project budget", required: false, weight: 1 },
  { key: GrantDocumentType.OwnerResume, label: "Owner resume", required: false, weight: 1 },
];

export function parseGrantRequirements(
  fields: unknown,
  documents: unknown,
): { fields: GrantRequirementItem[]; documents: GrantRequirementItem[] } {
  const parseList = (raw: unknown, fallback: GrantRequirementItem[]) => {
    if (!Array.isArray(raw) || raw.length === 0) return fallback;
    return raw
      .filter((item): item is GrantRequirementItem => typeof item?.key === "string")
      .map((item) => ({
        key: item.key,
        label: item.label ?? item.key,
        required: item.required !== false,
        weight: Math.max(1, item.weight ?? 1),
      }));
  };

  return {
    fields: parseList(fields, DEFAULT_REQUIRED_FIELDS),
    documents: parseList(documents, DEFAULT_REQUIRED_DOCUMENTS),
  };
}

function weightOf(item: GrantRequirementItem): number {
  return Math.max(1, item.weight ?? 1);
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

/** Map grant_profiles.profile jsonb to intake field keys. */
export function profileToIntakeValues(profile: GrantProfile | Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!profile) return {};
  const p = profile as GrantProfile & Record<string, unknown>;
  const province = p.province ?? provinceFromLocation(p.location);
  return {
    [GrantIntakeFieldKey.Industry]: p.industry,
    [GrantIntakeFieldKey.Province]: province,
    [GrantIntakeFieldKey.EmployeeCount]: p.employeeCount,
    [GrantIntakeFieldKey.RevenueRange]: p.revenueRange,
    [GrantIntakeFieldKey.GrowthStage]: p.growthStage,
    [GrantIntakeFieldKey.BusinessName]: p.businessName,
    [GrantIntakeFieldKey.LegalStructure]: p.legalStructure,
    [GrantIntakeFieldKey.ProjectSummary]: p.projectSummary,
    [GrantIntakeFieldKey.FundingAmountRequested]: p.fundingAmountRequested,
  };
}

function mergeAnswerMap(
  profile: GrantProfile | Record<string, unknown> | null | undefined,
  answers: GrantIntakeAnswer[],
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const [key, value] of Object.entries(profileToIntakeValues(profile))) {
    if (hasValue(value)) map.set(key, value);
  }
  for (const row of answers) {
    if (hasValue(row.value)) map.set(row.field_key, row.value);
  }
  return map;
}

function weightedCoverage(
  items: GrantRequirementItem[],
  presentKeys: Set<string>,
  requiredOnly: boolean,
): { pct: number; missing: GrantRequirementItem[] } {
  const scoped = items.filter((item) => (requiredOnly ? item.required !== false : true));
  if (!scoped.length) return { pct: 100, missing: [] };

  let totalWeight = 0;
  let presentWeight = 0;
  const missing: GrantRequirementItem[] = [];

  for (const item of scoped) {
    const w = weightOf(item);
    totalWeight += w;
    if (presentKeys.has(item.key)) {
      presentWeight += w;
    } else if (item.required !== false) {
      missing.push(item);
    }
  }

  return {
    pct: totalWeight ? Math.round((presentWeight / totalWeight) * 100) : 100,
    missing,
  };
}

function optionalBonus(
  items: GrantRequirementItem[],
  presentKeys: Set<string>,
): number {
  let bonus = 0;
  for (const item of items) {
    if (item.required === false && presentKeys.has(item.key)) {
      bonus += 1;
    }
  }
  return Math.min(5, bonus);
}

export function scoreToReadinessStatus(score: number): ReadinessStatus {
  if (score >= 90) return "ready";
  if (score >= 70) return "mostly_ready";
  if (score >= 40) return "partially_ready";
  return "not_ready";
}

export function analyzeReadiness(input: {
  requiredFields: GrantRequirementItem[];
  requiredDocuments: GrantRequirementItem[];
  profile?: GrantProfile | Record<string, unknown> | null;
  answers?: GrantIntakeAnswer[];
  documents?: GrantDocumentRecord[];
  packageMinReadiness?: number;
}): ReadinessResult {
  const answerMap = mergeAnswerMap(input.profile ?? null, input.answers ?? []);
  const answerKeys = new Set(answerMap.keys());

  const profileItems = input.requiredFields.filter((f) => PROFILE_FIELD_KEYS.has(f.key));
  const profilePresent = new Set(
    [...answerKeys].filter((key) => PROFILE_FIELD_KEYS.has(key) && hasValue(answerMap.get(key))),
  );
  const profileCoverage = weightedCoverage(profileItems, profilePresent, true);

  const intakeFieldItems = input.requiredFields.filter((f) => !PROFILE_FIELD_KEYS.has(f.key));
  const intakeCoverage = weightedCoverage(intakeFieldItems, answerKeys, true);

  const docPresent = new Set(
    (input.documents ?? [])
      .filter((d) => d.status === "uploaded" || d.status === "verified")
      .map((d) => d.document_type),
  );
  const docCoverage = weightedCoverage(input.requiredDocuments, docPresent, true);

  const answersPct = intakeCoverage.pct;
  const profilePct = profileCoverage.pct;
  const documentsPct = docCoverage.pct;

  const bonus = optionalBonus(
    [...input.requiredFields, ...input.requiredDocuments],
    new Set([...answerKeys, ...docPresent]),
  );

  const score = Math.min(
    100,
    Math.round(profilePct * 0.3 + answersPct * 0.4 + documentsPct * 0.3 + bonus),
  );

  const status = scoreToReadinessStatus(score);
  const packageMin = input.packageMinReadiness ?? 0;

  return {
    score,
    status,
    meetsPackageThreshold: score >= packageMin,
    details: {
      missingFields: [...profileCoverage.missing, ...intakeCoverage.missing],
      missingDocuments: docCoverage.missing,
      profileGaps: profileCoverage.missing,
      blockers: [],
      profilePct,
      answersPct,
      documentsPct,
      optionalBonus: bonus,
    },
  };
}

export function listMissing(input: {
  requiredFields: GrantRequirementItem[];
  requiredDocuments: GrantRequirementItem[];
  profile?: GrantProfile | Record<string, unknown> | null;
  answers?: GrantIntakeAnswer[];
  documents?: GrantDocumentRecord[];
}): { fields: GrantRequirementItem[]; documents: GrantRequirementItem[] } {
  const result = analyzeReadiness(input);
  return {
    fields: result.details.missingFields,
    documents: result.details.missingDocuments,
  };
}
