/** Rules-first readiness engine — shared by grant-intake-assistant edge function. */

export type GrantRequirementItem = {
  key: string;
  label: string;
  required?: boolean;
  weight?: number;
};

export type GrantIntakeAnswer = {
  field_key: string;
  value: unknown;
};

export type GrantDocumentRecord = {
  document_type: string;
  status: string;
};

export type ReadinessStatus =
  | "not_ready"
  | "partially_ready"
  | "mostly_ready"
  | "ready";

const PROFILE_FIELD_KEYS = new Set([
  "industry",
  "province",
  "employee_count",
  "revenue_range",
  "growth_stage",
]);

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

function weightedCoverage(
  items: GrantRequirementItem[],
  presentKeys: Set<string>,
): { pct: number; missing: GrantRequirementItem[] } {
  const required = items.filter((item) => item.required !== false);
  if (!required.length) return { pct: 100, missing: [] };

  let totalWeight = 0;
  let presentWeight = 0;
  const missing: GrantRequirementItem[] = [];

  for (const item of required) {
    const w = weightOf(item);
    totalWeight += w;
    if (presentKeys.has(item.key)) presentWeight += w;
    else missing.push(item);
  }

  return {
    pct: totalWeight ? Math.round((presentWeight / totalWeight) * 100) : 100,
    missing,
  };
}

function optionalBonus(items: GrantRequirementItem[], presentKeys: Set<string>): number {
  let bonus = 0;
  for (const item of items) {
    if (item.required === false && presentKeys.has(item.key)) bonus += 1;
  }
  return Math.min(5, bonus);
}

export function scoreToReadinessStatus(score: number): ReadinessStatus {
  if (score >= 90) return "ready";
  if (score >= 70) return "mostly_ready";
  if (score >= 40) return "partially_ready";
  return "not_ready";
}

export function profileToIntakeValues(profile: Record<string, unknown> | null): Record<string, unknown> {
  if (!profile) return {};
  const location = typeof profile.location === "string" ? profile.location.toLowerCase() : "";
  let province = profile.province;
  if (!province && location) {
    if (location.includes("ontario") || location.includes("toronto")) province = "Ontario";
    else if (location.includes("british columbia") || location.includes("vancouver")) province = "British Columbia";
    else if (location.includes("alberta") || location.includes("calgary")) province = "Alberta";
    else if (location.includes("quebec") || location.includes("montreal")) province = "Quebec";
  }
  return {
    industry: profile.industry,
    province,
    employee_count: profile.employeeCount ?? profile.employee_count,
    revenue_range: profile.revenueRange ?? profile.revenue_range,
    growth_stage: profile.growthStage ?? profile.growth_stage,
    business_name: profile.businessName ?? profile.business_name,
    legal_structure: profile.legalStructure ?? profile.legal_structure,
    project_summary: profile.projectSummary ?? profile.project_summary,
    funding_amount_requested: profile.fundingAmountRequested ?? profile.funding_amount_requested,
  };
}

export function analyzeReadinessRules(input: {
  requiredFields: GrantRequirementItem[];
  requiredDocuments: GrantRequirementItem[];
  profile?: Record<string, unknown> | null;
  answers?: GrantIntakeAnswer[];
  documents?: GrantDocumentRecord[];
}): {
  score: number;
  status: ReadinessStatus;
  details: Record<string, unknown>;
} {
  const answerMap = new Map<string, unknown>();
  for (const [key, value] of Object.entries(profileToIntakeValues(input.profile ?? null))) {
    if (hasValue(value)) answerMap.set(key, value);
  }
  for (const row of input.answers ?? []) {
    if (hasValue(row.value)) answerMap.set(row.field_key, row.value);
  }
  const answerKeys = new Set(answerMap.keys());

  const profileItems = input.requiredFields.filter((f) => PROFILE_FIELD_KEYS.has(f.key));
  const profilePresent = new Set(
    [...answerKeys].filter((key) => PROFILE_FIELD_KEYS.has(key)),
  );
  const profileCoverage = weightedCoverage(profileItems, profilePresent);

  const intakeItems = input.requiredFields.filter((f) => !PROFILE_FIELD_KEYS.has(f.key));
  const intakeCoverage = weightedCoverage(intakeItems, answerKeys);

  const docPresent = new Set(
    (input.documents ?? [])
      .filter((d) => d.status === "uploaded" || d.status === "verified")
      .map((d) => d.document_type),
  );
  const docCoverage = weightedCoverage(input.requiredDocuments, docPresent);

  const bonus = optionalBonus(
    [...input.requiredFields, ...input.requiredDocuments],
    new Set([...answerKeys, ...docPresent]),
  );

  const score = Math.min(
    100,
    Math.round(
      profileCoverage.pct * 0.3 +
        intakeCoverage.pct * 0.4 +
        docCoverage.pct * 0.3 +
        bonus,
    ),
  );

  return {
    score,
    status: scoreToReadinessStatus(score),
    details: {
      missingFields: [...profileCoverage.missing, ...intakeCoverage.missing],
      missingDocuments: docCoverage.missing,
      profileGaps: profileCoverage.missing,
      blockers: [],
      profilePct: profileCoverage.pct,
      answersPct: intakeCoverage.pct,
      documentsPct: docCoverage.pct,
      optionalBonus: bonus,
    },
  };
}

export function listMissingRules(input: {
  requiredFields: GrantRequirementItem[];
  requiredDocuments: GrantRequirementItem[];
  profile?: Record<string, unknown> | null;
  answers?: GrantIntakeAnswer[];
  documents?: GrantDocumentRecord[];
}) {
  const result = analyzeReadinessRules(input);
  const details = result.details as {
    missingFields: GrantRequirementItem[];
    missingDocuments: GrantRequirementItem[];
  };
  return {
    fields: details.missingFields ?? [],
    documents: details.missingDocuments ?? [],
  };
}
