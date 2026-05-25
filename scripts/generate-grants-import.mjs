import fs from "node:fs";
import path from "node:path";

const inputPath =
  process.argv[2] ??
  "C:\\Users\\flood\\Membership\\rtm-community-network\\RTM_Canada_Grants_Database.csv";
const outputPath =
  process.argv[3] ??
  path.join(process.cwd(), "supabase", "migrations", "20260524140000_import_rtm_canada_grants.sql");

const provinceNames = {
  ALL: "All Canada",
  ON: "Ontario",
  BC: "British Columbia",
  AB: "Alberta",
  QC: "Quebec",
  MB: "Manitoba",
  SK: "Saskatchewan",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  PE: "Prince Edward Island",
  NT: "Northwest Territories",
  NU: "Nunavut",
  YT: "Yukon",
};

const sectorLabels = {
  ai_digital: "AI & Digital",
  clean_tech: "Clean Technology",
  food_beverage: "Food & Beverage",
  professional_services: "Professional Services",
  film_media: "Film & Media",
  digital_media: "Digital Media",
  life_sciences: "Life Sciences",
  medical_devices: "Medical Devices",
  waste_management: "Waste Management",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift();
  return rows
    .filter((r) => r.some((cell) => cell.trim().length))
    .map((r) => Object.fromEntries(headers.map((header, index) => [header, r[index] ?? ""])));
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value, fallback = "null") {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : fallback;
}

function sqlBoolean(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "t", "yes", "1"].includes(normalized)) return "true";
  if (["false", "f", "no", "0"].includes(normalized)) return "false";
  return "null";
}

function splitPipe(value) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function labelize(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return sectorLabels[raw] ?? raw.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSqlTextArray(items) {
  const clean = items.filter(Boolean);
  if (!clean.length) return "'{}'::text[]";
  return `array[${clean.map(sqlString).join(", ")}]`;
}

function provinceList(raw) {
  return splitPipe(String(raw).replaceAll(",", "|")).flatMap((code) => {
    if (code === "YT,NT,NU") return ["Yukon", "Northwest Territories", "Nunavut"];
    return [provinceNames[code] ?? code];
  });
}

function baseRequiredFields(row) {
  const fields = [
    { key: "business_name", label: "Legal business name", required: true, weight: 2 },
    { key: "legal_structure", label: "Legal structure (incorporated, sole prop, etc.)", required: true, weight: 1 },
    { key: "province", label: "Primary province of operation", required: true, weight: 2 },
    { key: "industry", label: "Industry or sector", required: true, weight: 1 },
    { key: "employee_count", label: "Number of employees", required: true, weight: 1 },
    { key: "revenue_range", label: "Annual revenue range", required: true, weight: 1 },
    { key: "years_operating", label: "Years in operation", required: Number(row.min_years_operating || 0) > 0, weight: 1 },
    { key: "project_summary", label: "Project or funding purpose summary", required: true, weight: 2 },
    { key: "funding_amount_requested", label: "Funding amount requested", required: false, weight: 1 },
  ];

  if (row.match_required === "True") {
    fields.push({ key: "matching_funds", label: "Matching funds available", required: true, weight: 2 });
  }
  if (row.designations) {
    fields.push({ key: "ownership_designation", label: "Ownership or eligibility designation", required: true, weight: 1 });
  }

  return fields;
}

function baseRequiredDocuments(row) {
  const docs = [
    { key: "business_registration", label: "Business registration or incorporation documents", required: true, weight: 2 },
    { key: "business_number", label: "CRA Business Number / GST-HST confirmation", required: true, weight: 1 },
    { key: "financial_statements", label: "Recent financial statements", required: Number(row.min_revenue || 0) > 0, weight: 2 },
    { key: "business_plan", label: "Business plan or executive summary", required: true, weight: 1 },
    { key: "project_budget", label: "Project budget and timeline", required: row.match_required === "True", weight: 1 },
  ];

  const tags = splitPipe(row.tags);
  const sectors = splitPipe(row.sectors);
  if (tags.includes("wage_subsidy") || tags.includes("hiring")) {
    docs.push({ key: "payroll_records", label: "Payroll records or hiring plan", required: true, weight: 1 });
  }
  if (tags.includes("tax_credit") || row.funding_type === "tax_credit" || row.type === "tax_credit") {
    docs.push({ key: "tax_returns", label: "Corporate or personal tax returns", required: true, weight: 1 });
  }
  if (sectors.includes("technology") || tags.includes("r_and_d")) {
    docs.push({ key: "technical_project_plan", label: "Technical project plan or R&D summary", required: false, weight: 1 });
  }

  return docs;
}

function requirements(row) {
  const items = [];
  if (row.eligibility_notes) items.push(row.eligibility_notes);
  if (Number(row.min_years_operating || 0) > 0) items.push(`${row.min_years_operating}+ years operating`);
  if (Number(row.min_employees || 0) > 0) items.push(`${row.min_employees}+ employees`);
  if (Number(row.min_revenue || 0) > 0) items.push(`Minimum annual revenue $${Number(row.min_revenue).toLocaleString("en-CA")}`);
  if (row.province && row.province !== "ALL") items.push(`Operates in ${provinceList(row.province).join(", ")}`);
  return items.slice(0, 6);
}

function applicationSteps(row) {
  const steps = [
    "Confirm current intake status on the official program page",
    "Verify business eligibility against RTM readiness requirements",
    "Gather required business and financial documents",
    "Prepare project narrative, budget, and expected outcomes",
  ];
  if (row.match_required === "True") {
    steps.push(`Confirm matching funds (${row.match_percent || 0}% cost share)`);
  }
  steps.push("Submit through the official portal or proceed with RTM advisor support");
  return steps;
}

function fundingNotes(row) {
  const notes = [];
  if (row.is_repayable === "True") notes.push("Repayable or loan-style funding may apply.");
  if (row.match_required === "True") notes.push(`Matching contribution required (${row.match_percent || 0}%).`);
  if (row.rtm_processing_eligible !== "True") notes.push("RTM processing may be limited; use self-serve guidance unless an advisor confirms fit.");
  return notes.join(" ");
}

function deadlineLabel(row) {
  const type = labelize(row.deadline_type);
  if (!type) return null;
  return row.intake_open === "True" ? `${type} - intake open` : `${type} - intake currently closed`;
}

function rowSql(row) {
  const sectors = splitPipe(row.sectors).map(labelize);
  const tags = splitPipe(row.tags);
  const designations = splitPipe(row.designations).map(labelize);
  const stages = splitPipe(row.business_stages).map(labelize);
  const provinces = provinceList(row.province);
  const level = labelize(row.level);
  const amountMax = sqlNumber(row.amount_max, "0");
  const matchScore = row.rtm_processing_eligible === "True" ? 74 : 58;

  const values = [
    sqlString(row.id),
    sqlString(row.name),
    sqlString(row.org),
    amountMax,
    String(matchScore),
    "null",
    sqlString(row.application_difficulty),
    sqlString(level),
    toSqlTextArray(requirements(row)),
    sqlNumber(row.approval_rate_pct, "0"),
    sqlString(row.description),
    sqlString(row.url),
    sqlString(deadlineLabel(row)),
    toSqlTextArray(sectors),
    toSqlTextArray(provinces),
    sqlBoolean(row.is_active),
    sqlString(row.eligibility_notes),
    toSqlTextArray(applicationSteps(row)),
    sqlString(fundingNotes(row)),
    sqlString(row.org),
    sqlString(row.category),
    sqlString(row.subcategory),
    sqlString(level),
    sqlString(row.province),
    sqlString(row.type),
    sqlNumber(row.amount_min),
    sqlNumber(row.amount_max),
    sqlString(row.amount_label),
    toSqlTextArray(designations),
    toSqlTextArray(stages),
    sqlNumber(row.min_years_operating),
    sqlNumber(row.min_employees),
    sqlNumber(row.max_employees),
    sqlNumber(row.min_revenue),
    sqlNumber(row.max_revenue),
    sqlNumber(row.application_hours_estimate),
    sqlString(row.deadline_type),
    sqlBoolean(row.intake_open),
    sqlBoolean(row.is_repayable),
    sqlBoolean(row.stacking_allowed),
    sqlBoolean(row.match_required),
    sqlNumber(row.match_percent),
    toSqlTextArray(tags),
    sqlBoolean(row.rtm_processing_eligible),
    sqlString(JSON.stringify(baseRequiredFields(row))),
    sqlString(JSON.stringify(baseRequiredDocuments(row))),
  ];

  return `  (${values.join(", ")})`;
}

const csv = fs.readFileSync(inputPath, "utf8");
const rows = parseCsv(csv);
if (!rows.length) throw new Error(`No grant rows found in ${inputPath}`);

const columns = [
  "id",
  "name",
  "organization",
  "amount",
  "match_score",
  "deadline_days",
  "difficulty",
  "type",
  "requirements",
  "approval_rate",
  "description",
  "official_url",
  "deadline_label",
  "sectors",
  "provinces",
  "is_active",
  "eligibility_summary",
  "application_steps",
  "funding_notes",
  "org",
  "category",
  "subcategory",
  "level",
  "province",
  "funding_type",
  "amount_min",
  "amount_max",
  "amount_label",
  "designations",
  "business_stages",
  "min_years_operating",
  "min_employees",
  "max_employees",
  "min_revenue",
  "max_revenue",
  "application_hours_estimate",
  "deadline_type",
  "intake_open",
  "is_repayable",
  "stacking_allowed",
  "match_required",
  "match_percent",
  "tags",
  "rtm_processing_eligible",
  "required_fields",
  "required_documents",
];

const sql = `-- RTM Canada grants catalog import.
-- Generated from: ${inputPath.replaceAll("\\", "/")}
-- Source rows: ${rows.length}
-- Re-run safe: updates existing grants by id.

begin;

alter table public.grants add column if not exists org text;
alter table public.grants add column if not exists category text;
alter table public.grants add column if not exists subcategory text;
alter table public.grants add column if not exists level text;
alter table public.grants add column if not exists province text;
alter table public.grants add column if not exists funding_type text;
alter table public.grants add column if not exists amount_min numeric;
alter table public.grants add column if not exists amount_max numeric;
alter table public.grants add column if not exists amount_label text;
alter table public.grants add column if not exists designations text[] default '{}';
alter table public.grants add column if not exists business_stages text[] default '{}';
alter table public.grants add column if not exists min_years_operating int;
alter table public.grants add column if not exists min_employees int;
alter table public.grants add column if not exists max_employees int;
alter table public.grants add column if not exists min_revenue numeric;
alter table public.grants add column if not exists max_revenue numeric;
alter table public.grants add column if not exists application_hours_estimate int;
alter table public.grants add column if not exists deadline_type text;
alter table public.grants add column if not exists intake_open boolean;
alter table public.grants add column if not exists is_repayable boolean;
alter table public.grants add column if not exists stacking_allowed boolean;
alter table public.grants add column if not exists match_required boolean;
alter table public.grants add column if not exists match_percent int;
alter table public.grants add column if not exists tags text[] default '{}';
alter table public.grants add column if not exists rtm_processing_eligible boolean not null default true;
alter table public.grants add column if not exists required_fields jsonb not null default '[]'::jsonb;
alter table public.grants add column if not exists required_documents jsonb not null default '[]'::jsonb;

create index if not exists grants_category_idx on public.grants (category);
create index if not exists grants_level_idx on public.grants (level);
create index if not exists grants_province_idx on public.grants (province);
create index if not exists grants_intake_open_idx on public.grants (intake_open);
create index if not exists grants_rtm_processing_eligible_idx on public.grants (rtm_processing_eligible);

insert into public.grants (${columns.join(", ")})
values
${rows.map(rowSql).join(",\n")}
on conflict (id) do update set
${columns
  .filter((column) => column !== "id")
  .map((column) => `  ${column} = excluded.${column}`)
  .join(",\n")};

commit;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sql);
console.log(`Wrote ${rows.length} grants to ${outputPath}`);
