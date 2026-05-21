import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request, supabase: any) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    throw new Error("Admin access required");
  }
}

// Custom CSV parser that handles multi-line quoted fields and variable field counts
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        current.push(field);
        field = "";
        i++;
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        current.push(field);
        field = "";
        if (current.length > 1 || current[0] !== "") {
          rows.push(current);
        }
        current = [];
        i += ch === '\r' ? 2 : 1;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/row
  if (field || current.length > 0) {
    current.push(field);
    if (current.length > 1 || current[0] !== "") {
      rows.push(current);
    }
  }

  return rows;
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

function parseCategory(raw: string): { category: string; subcategory?: string } {
  if (!raw) return { category: "General" };
  const first = raw.split("|")[0].trim();
  const parts = first.split(">");
  return {
    category: parts[0]?.trim() || "General",
    subcategory: parts[1]?.trim() || undefined,
  };
}

function parseLocation(raw: string): { city: string; province: string } {
  if (!raw) return { city: "Toronto", province: "Ontario" };

  const provinces: string[] = [
    "Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba",
    "Saskatchewan", "Nova Scotia", "New Brunswick",
    "Newfoundland and Labrador", "Prince Edward Island",
    "Northwest Territories", "Yukon", "Nunavut",
  ];

  // Check if the raw value itself is a province
  const trimmed = raw.trim();
  if (provinces.includes(trimmed)) {
    return { city: "", province: trimmed };
  }

  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
  let city = "";
  let province = "Ontario";

  for (const part of parts) {
    if (provinces.includes(part)) {
      province = part;
    } else {
      city = part;
    }
  }

  return { city, province };
}

function cleanPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return raw.trim() || null;
}

function extractRating(raw: string): number {
  if (!raw) return 4.0;
  const num = parseFloat(raw);
  if (isNaN(num) || num < 1 || num > 5) return 4.0;
  return num;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await requireAdmin(req, supabase);

    const { csvText, dryRun } = await req.json();

    if (!csvText) {
      return new Response(
        JSON.stringify({ error: "csvText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip BOM
    const cleanCsv = csvText.replace(/^\uFEFF/, "");
    console.log("Parsing CSV, length:", cleanCsv.length);

    const allRows = parseCSV(cleanCsv);
    console.log(`Parsed ${allRows.length} total rows (including header)`);

    if (allRows.length < 2) {
      return new Response(
        JSON.stringify({ error: "CSV has no data rows" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build header map
    const headers = allRows[0].map((h) => h.trim());
    const hIdx: Record<string, number> = {};
    headers.forEach((h, i) => { hIdx[h] = i; });

    console.log("Header count:", headers.length);
    console.log("Key columns - ID:", hIdx["ID"], "Title:", hIdx["Title"],
      "Post Type:", hIdx["Post Type"], "Status:", hIdx["Status"],
      "Business Type:", hIdx["Business Type"], "Business Location:", hIdx["Business Location"],
      "business-description:", hIdx["business-description"], "phone-numbe:", hIdx["phone-numbe"]);

    const get = (row: string[], col: string): string => {
      const idx = hIdx[col];
      if (idx === undefined || idx >= row.length) return "";
      return row[idx] || "";
    };

    const businesses: any[] = [];
    let skipped = 0;
    const skipReasons: Record<string, number> = {};

    for (let r = 1; r < allRows.length; r++) {
      const row = allRows[r];

      const postType = get(row, "Post Type").trim();
      const status = get(row, "Status").trim();

      if (postType !== "business") {
        skipped++;
        skipReasons[`type:${postType || "empty"}`] = (skipReasons[`type:${postType || "empty"}`] || 0) + 1;
        continue;
      }
      if (status !== "publish") {
        skipped++;
        skipReasons[`status:${status || "empty"}`] = (skipReasons[`status:${status || "empty"}`] || 0) + 1;
        continue;
      }

      const wpId = get(row, "ID").trim();
      const title = get(row, "Title").trim().replace(/&amp;/g, "&");
      if (!title || !wpId) {
        skipped++;
        skipReasons["no-title-or-id"] = (skipReasons["no-title-or-id"] || 0) + 1;
        continue;
      }

      const businessId = `wp-${wpId}`;
      const { category, subcategory } = parseCategory(get(row, "Business Type"));
      const { city, province } = parseLocation(get(row, "Business Location"));
      const description = stripHtml(get(row, "business-description"));
      const addressRaw = get(row, "address").trim();

      // Images
      const imageUrls = get(row, "Image URL").split("|").map((s) => s.trim()).filter(Boolean);
      const image = imageUrls[0] || "";
      const photos = imageUrls.slice(0, 6);

      // Logo
      const logoRaw = get(row, "business-logo").trim();
      const logo = logoRaw && logoRaw.startsWith("http") ? logoRaw : null;

      const phone = cleanPhone(get(row, "phone-numbe"));
      const websiteRaw = get(row, "website").trim();
      const website = websiteRaw
        ? websiteRaw.startsWith("http") ? websiteRaw : `https://${websiteRaw}`
        : null;
      const rating = extractRating(get(row, "ratings"));

      const features: string[] = [];
      if (get(row, "facebook").trim()) features.push("Social Media");
      if (get(row, "instagram").trim()) features.push("Instagram");
      if (website) features.push("Website");
      if (phone) features.push("Phone Support");

      // Try to extract city from address if not in Business Location
      let finalCity = city;
      if (!finalCity && addressRaw) {
        const addrParts = addressRaw.split(",").map(s => s.trim());
        if (addrParts.length > 1) {
          finalCity = addrParts[addrParts.length - 1];
        }
      }

      businesses.push({
        business_id: businessId,
        name: title,
        category,
        subcategory: subcategory || null,
        description: description || `${title} - ${category} business in ${finalCity || province}`,
        image,
        logo,
        rating,
        review_count: Math.floor(Math.random() * 50) + 5,
        price_range: "$$",
        address: addressRaw,
        city: finalCity || "Toronto",
        province,
        phone,
        website,
        is_verified: true,
        is_open: true,
        features,
        ownership: [],
        photos,
        is_world_cup_ready: false,
        is_new: false,
        is_trending: false,
        is_award_winner: false,
      });
    }

    console.log(`Prepared ${businesses.length} businesses, skipped ${skipped}`);
    console.log("Skip reasons:", JSON.stringify(skipReasons));

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          count: businesses.length,
          skipped,
          skipReasons,
          sample: businesses.slice(0, 3),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch upsert
    const BATCH_SIZE = 50;
    let inserted = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
      const batch = businesses.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("businesses")
        .upsert(batch, { onConflict: "business_id" });

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE} error:`, error.message);
        errorMessages.push(error.message);
        errors++;
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: inserted,
        total: businesses.length,
        skipped,
        errors,
        errorMessages: errorMessages.slice(0, 5),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
