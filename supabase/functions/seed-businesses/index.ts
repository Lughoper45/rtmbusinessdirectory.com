import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// Seeded RNG for consistent data
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  pickMultiple<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }
  boolean(p = 0.5) { return this.next() < p; }
  range(min: number, max: number) { return Math.floor(this.next() * (max - min + 1)) + min; }
  weightedPick<T extends { weight: number }>(items: T[]): T {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = this.next() * total;
    for (const item of items) { r -= item.weight; if (r <= 0) return item; }
    return items[items.length - 1];
  }
}

const CITIES: Record<string, { name: string; province: string; areaCode: string; lat: number; lng: number; streets: string[]; neighborhoods: string[]; postalPrefix: string[] }> = {
  toronto: { name: "Toronto", province: "ON", areaCode: "416", lat: 43.6532, lng: -79.3832, streets: ["King St W","Queen St W","Yonge St","Bloor St W","Dundas St W","College St","Spadina Ave","Bay St","Front St W","Adelaide St W"], neighborhoods: ["Downtown","Yorkville","Liberty Village","Kensington Market","The Annex","Leslieville","Parkdale","Danforth","Roncesvalles","Junction"], postalPrefix: ["M5","M4","M6"] },
  vancouver: { name: "Vancouver", province: "BC", areaCode: "604", lat: 49.2827, lng: -123.1207, streets: ["Robson St","Granville St","Main St","Commercial Dr","Davie St","Hastings St","Broadway","Cambie St"], neighborhoods: ["Gastown","Yaletown","Kitsilano","Mount Pleasant","Chinatown","West End","Coal Harbour","Kerrisdale"], postalPrefix: ["V5","V6"] },
  montreal: { name: "Montreal", province: "QC", areaCode: "514", lat: 45.5017, lng: -73.5673, streets: ["Rue Sainte-Catherine","Boulevard Saint-Laurent","Rue Saint-Denis","Avenue du Mont-Royal","Rue Sherbrooke","Boulevard de Maisonneuve"], neighborhoods: ["Old Montreal","Plateau","Mile End","Griffintown","Westmount","Outremont","Verdun","Hochelaga"], postalPrefix: ["H2","H3"] },
  calgary: { name: "Calgary", province: "AB", areaCode: "403", lat: 51.0447, lng: -114.0719, streets: ["17th Avenue SW","Stephen Avenue","4th Street SW","Centre Street","Macleod Trail","Crowchild Trail"], neighborhoods: ["Kensington","Inglewood","Beltline","Mission","Bridgeland","Marda Loop"], postalPrefix: ["T2","T3"] },
  ottawa: { name: "Ottawa", province: "ON", areaCode: "613", lat: 45.4215, lng: -75.6972, streets: ["Rideau St","Elgin St","Bank St","Sparks St","Wellington St","Somerset St"], neighborhoods: ["ByWard Market","Centretown","Glebe","Westboro","Hintonburg","Sandy Hill"], postalPrefix: ["K1","K2"] },
  edmonton: { name: "Edmonton", province: "AB", areaCode: "780", lat: 53.5461, lng: -113.4938, streets: ["Jasper Avenue","Whyte Avenue","109 Street","124 Street","Stony Plain Road"], neighborhoods: ["Old Strathcona","Downtown","Oliver","Garneau","Glenora","Bonnie Doon"], postalPrefix: ["T5","T6"] },
  winnipeg: { name: "Winnipeg", province: "MB", areaCode: "204", lat: 49.8951, lng: -97.1384, streets: ["Portage Avenue","Main Street","Corydon Avenue","Osborne Street","Henderson Highway"], neighborhoods: ["Exchange District","Osborne Village","Wolseley","Corydon","River Heights","St. Boniface"], postalPrefix: ["R2","R3"] },
  halifax: { name: "Halifax", province: "NS", areaCode: "902", lat: 44.6488, lng: -63.5752, streets: ["Spring Garden Road","Barrington Street","Gottingen Street","Quinpool Road","Robie Street"], neighborhoods: ["Downtown","North End","South End","West End","Hydrostone","Dartmouth"], postalPrefix: ["B3"] },
  victoria: { name: "Victoria", province: "BC", areaCode: "250", lat: 48.4284, lng: -123.3656, streets: ["Government Street","Douglas Street","Fort Street","Cook Street","Pandora Avenue"], neighborhoods: ["Downtown","James Bay","Fernwood","Oak Bay","Fairfield","Esquimalt"], postalPrefix: ["V8"] },
  quebec_city: { name: "Quebec City", province: "QC", areaCode: "418", lat: 46.8139, lng: -71.2080, streets: ["Rue Saint-Jean","Grande Allée","Boulevard Laurier","Rue Saint-Joseph","Côte de la Fabrique"], neighborhoods: ["Old Quebec","Saint-Roch","Montcalm","Saint-Jean-Baptiste","Limoilou","Sainte-Foy"], postalPrefix: ["G1"] },
};

const CITY_WEIGHTS = [
  { key: "toronto", weight: 0.40 }, { key: "vancouver", weight: 0.12 }, { key: "montreal", weight: 0.12 },
  { key: "calgary", weight: 0.08 }, { key: "ottawa", weight: 0.06 }, { key: "edmonton", weight: 0.05 },
  { key: "winnipeg", weight: 0.05 }, { key: "halifax", weight: 0.04 }, { key: "victoria", weight: 0.04 },
  { key: "quebec_city", weight: 0.04 },
];

const CATEGORIES = [
  { key: "restaurants", name: "Restaurants & Food", weight: 0.30, subs: ["Fine Dining","Casual Dining","Fast Casual","Café & Coffee","Bakery","Bar & Lounge","Food Truck","Buffet"] },
  { key: "retail", name: "Retail & Shopping", weight: 0.15, subs: ["Clothing","Electronics","Grocery","Specialty","Bookstore","Furniture","Jewelry","Sports"] },
  { key: "professional", name: "Professional Services", weight: 0.15, subs: ["Legal","Accounting","Consulting","Marketing","Real Estate","Insurance","Architecture","Engineering"] },
  { key: "health", name: "Health & Wellness", weight: 0.12, subs: ["Medical Clinic","Dental","Pharmacy","Fitness","Physiotherapy","Mental Health","Optometry","Chiropractic"] },
  { key: "homeServices", name: "Home Services", weight: 0.10, subs: ["Plumbing","Electrical","HVAC","Landscaping","Cleaning","Renovation","Painting","Roofing"] },
  { key: "entertainment", name: "Entertainment & Events", weight: 0.08, subs: ["Live Music","Theatre","Cinema","Gaming","Bowling","Escape Room","Art Gallery","Museum"] },
  { key: "beauty", name: "Beauty & Personal Care", weight: 0.10, subs: ["Hair Salon","Spa","Nail Salon","Barbershop","Skincare","Tattoo","Aesthetics","Massage"] },
];

const CUISINES = ["Italian","Chinese","Japanese","Indian","Mexican","Thai","French","Korean","Vietnamese","Middle Eastern","Greek","Caribbean","Ethiopian","Portuguese","Turkish"];
const PREFIXES = ["Maple","Northern","Golden","Royal","Pacific","Cedar","Silver","Grand","Heritage","Summit","Prime","Elite","Urban","Metro","Capital"];
const FIRSTNAMES = ["James","Sarah","Michael","Emma","David","Maria","Robert","Lisa","Ahmed","Wei","Priya","Carlos","Fatima","Ivan","Yuki"];
const LASTNAMES = ["Smith","Chen","Singh","Kim","Patel","Williams","Brown","Garcia","Wilson","Lee","Taylor","Anderson","Thomas","Moore","Martin"];
const RESTAURANT_NAMES = ["Kitchen","Bistro","Grill","Café","Eatery","Tavern","House","Diner","Table","Plate","Spoon","Fork","Garden","Terrace","Lounge"];
const RETAIL_NAMES = ["Boutique","Emporium","Market","Shop","Store","Gallery","Outlet","Exchange","Hub","Depot"];
const SERVICE_NAMES = ["Associates","Partners","Group","Solutions","Advisors","Consultants","Services","Agency","Studio","Lab"];
const FEATURES_MAP: Record<string, string[]> = {
  restaurants: ["Patio Dining","Takeout","Delivery","Live Music","Private Dining","Happy Hour","Brunch","Late Night","Catering","Wine List","Craft Beer","Vegan Options","Gluten-Free","Kids Menu","Group Dining"],
  retail: ["Free Parking","Gift Wrapping","Online Orders","Returns","Loyalty Program","Curbside Pickup","Personal Shopping","Gift Registry"],
  professional: ["Free Consultation","Virtual Meetings","Weekend Hours","Multilingual","Emergency Service","Satisfaction Guarantee"],
  health: ["Walk-ins Welcome","Online Booking","Insurance Accepted","Evening Hours","Weekend Hours","Telehealth","Parking","Wheelchair Accessible"],
  homeServices: ["Free Estimates","Emergency Service","Licensed & Insured","Warranty","Same Day Service","Eco-Friendly","Senior Discount"],
  entertainment: ["Private Events","Group Bookings","Gift Cards","Accessibility","Food & Drinks","VIP Experience"],
  beauty: ["Online Booking","Walk-ins Welcome","Gift Cards","Products for Sale","Bridal Services","Kids Services"],
};
const OWNERSHIP_TYPES = ["Canadian-Owned","Family-Owned","Women-Owned","Indigenous-Owned","Immigrant-Owned","Veteran-Owned","LGBTQ+-Owned","Black-Owned","Youth-Owned"];
const REVIEWER_NAMES = ["Alex M.","Jordan K.","Taylor S.","Morgan P.","Casey L.","Riley J.","Quinn D.","Avery N.","Jamie R.","Sam W."];
const PHOTO_URLS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=600&fit=crop",
];

function generateBusiness(id: number, rng: SeededRandom) {
  const cityEntry = rng.weightedPick(CITY_WEIGHTS);
  const cityData = CITIES[cityEntry.key];
  const catEntry = rng.weightedPick(CATEGORIES);
  const subcategory = rng.pick(catEntry.subs);
  const cuisine = catEntry.key === "restaurants" ? rng.pick(CUISINES) : null;

  // Name
  let name: string;
  if (rng.boolean(0.3)) {
    const fn = rng.pick(FIRSTNAMES);
    const ln = rng.pick(LASTNAMES);
    name = catEntry.key === "restaurants" ? `${fn}'s ${rng.pick(RESTAURANT_NAMES)}` : `${ln} ${rng.pick(SERVICE_NAMES)}`;
  } else {
    const prefix = rng.boolean(0.6) ? rng.pick(PREFIXES) + " " : "";
    const suffix = catEntry.key === "restaurants" ? rng.pick(RESTAURANT_NAMES)
      : catEntry.key === "retail" ? rng.pick(RETAIL_NAMES)
      : rng.pick(SERVICE_NAMES);
    name = prefix + suffix;
  }

  const streetNum = rng.range(1, 2500);
  const street = rng.pick(cityData.streets);
  const neighborhood = rng.pick(cityData.neighborhoods);
  const latOff = (rng.next() - 0.5) * 0.15;
  const lngOff = (rng.next() - 0.5) * 0.2;
  const ratingBase = rng.next();
  const rating = Number((3.0 + ratingBase * 2.0).toFixed(1));
  const reviewCount = rng.range(5, 500);
  const featurePool = FEATURES_MAP[catEntry.key] || FEATURES_MAP.restaurants;
  const features = rng.pickMultiple(featurePool, rng.range(3, 7));
  const ownership = OWNERSHIP_TYPES.filter(() => rng.boolean(0.15)).slice(0, 3);
  if (ownership.length === 0 && rng.boolean(0.7)) ownership.push("Canadian-Owned");
  const isWorldCupReady = rng.boolean(0.25);
  const isOpen = rng.boolean(0.7);
  const closingHour = rng.range(17, 23);
  const priceRange = rng.weightedPick([
    { v: "$", weight: 0.25 }, { v: "$$", weight: 0.40 }, { v: "$$$", weight: 0.25 }, { v: "$$$$", weight: 0.10 },
  ]).v;

  const isPositive = rng.boolean(0.85);
  const reviewRating = isPositive ? rng.range(4, 5) : rng.range(3, 4);

  const photos = rng.pickMultiple(PHOTO_URLS, rng.range(3, 6));

  return {
    business_id: `biz-${id.toString().padStart(5, "0")}`,
    name,
    category: catEntry.name,
    subcategory,
    description: "",
    image: photos[0],
    rating,
    review_count: reviewCount,
    price_range: priceRange,
    address: `${streetNum} ${street}`,
    city: cityData.name,
    province: cityData.province,
    is_open: isOpen,
    closing_time: isOpen ? `${closingHour}:00 PM` : null,
    phone: `(${cityData.areaCode}) ${rng.range(200, 999)}-${rng.range(1000, 9999)}`,
    website: rng.boolean(0.6) ? `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15)}.ca` : null,
    is_verified: rng.boolean(0.4),
    is_world_cup_ready: isWorldCupReady,
    is_new: rng.boolean(0.1),
    is_trending: rng.boolean(0.08),
    is_award_winner: rng.boolean(0.05),
    features,
    ownership,
    cuisine,
    recent_review_text: `Great ${catEntry.name.toLowerCase()} experience in ${neighborhood}!`,
    recent_review_author: rng.pick(REVIEWER_NAMES),
    recent_review_rating: reviewRating,
    lat: cityData.lat + latOff,
    lng: cityData.lng + lngOff,
    photos,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await requireAdmin(req, supabase);

    // Check if already seeded
    const { count } = await supabase.from("businesses").select("*", { count: "exact", head: true });
    if (count && count > 0) {
      return new Response(JSON.stringify({ success: true, message: `Already seeded with ${count} businesses` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rng = new SeededRandom(42);
    const BATCH_SIZE = 500;
    const TOTAL = 10000;
    let inserted = 0;

    for (let start = 1; start <= TOTAL; start += BATCH_SIZE) {
      const batch = [];
      for (let i = start; i < start + BATCH_SIZE && i <= TOTAL; i++) {
        batch.push(generateBusiness(i, rng));
      }
      const { error } = await supabase.from("businesses").insert(batch);
      if (error) {
        console.error(`Batch error at ${start}:`, error);
        return new Response(JSON.stringify({ success: false, error: error.message, inserted }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${TOTAL}`);
    }

    return new Response(JSON.stringify({ success: true, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
