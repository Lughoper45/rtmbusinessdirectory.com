import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRANT_KEYWORDS =
  /\b(grant|funding|fund|subsidy|loan program|financing|canexport|irap|csbfp|sred|sr&ed)\b/i;
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
): Promise<string> {
  const { wantsGrants } = extractSearchTerms(message);
  if (!wantsGrants) return "";

  const tokens = message
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3 && !GRANT_KEYWORDS.test(t))
    .slice(0, 4);

  let query = admin
    .from("grants")
    .select("id, name, organization, amount, eligibility_summary, official_url")
    .eq("is_active", true)
    .limit(5);

  if (tokens.length > 0) {
    const orParts = tokens.flatMap((t) => [
      `name.ilike.%${t}%`,
      `description.ilike.%${t}%`,
      `organization.ilike.%${t}%`,
    ]);
    query = query.or(orParts.join(","));
  }

  const { data, error } = await query.order("name");
  if (error || !data?.length) return "";

  const lines = data.map((g) => {
    const amount = g.amount ? `$${Number(g.amount).toLocaleString()}` : "Amount varies";
    const summary = g.eligibility_summary
      ? ` — ${String(g.eligibility_summary).slice(0, 120)}`
      : "";
    return `- ${g.name} (${g.organization}, ${amount})${summary}`;
  });
  return `Matching grant programs (from RTM catalog):\n${lines.join("\n")}`;
}

export async function buildLiveContextBlock(
  admin: SupabaseClient,
  lastUserMessage: string,
): Promise<string> {
  const [businesses, grants] = await Promise.all([
    queryBusinesses(admin, lastUserMessage),
    queryGrants(admin, lastUserMessage),
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
