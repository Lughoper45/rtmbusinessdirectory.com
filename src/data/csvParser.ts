import { CANADIAN_CITIES } from './constants/canadianData';
import type { CityKey } from './constants/canadianData';

const CATEGORY_MAPPING: Record<string, string> = {
  'Healtcare and Medical': 'Health & Medical',
  'Healthcare and Medical': 'Health & Medical',
  'Restaurants': 'Restaurants',
  'Shopping': 'Shopping',
  'Professional Services': 'Professional Services',
  'Banking and Finance': 'Banking & Finance',
  'Arts &amp; Entertainment': 'Arts & Entertainment',
  'Home Services': 'Home Services',
  'Automotive': 'Automotive',
  'Beauty & Spa': 'Beauty & Spa',
  'Fitness & Sports': 'Fitness & Sports',
  'Education': 'Education',
  'Travel & Tourism': 'Travel & Tourism',
};

const OWNERSHIP_MAPPING: Record<string, string> = {
  'H': 'Indigenous-owned',
  'M': 'Immigrant-owned',
  'W': 'Women-owned',
  'B': 'Black-owned',
  'V': 'Veteran-owned',
  'Y': 'Youth-owned',
  'LGBTQ': 'LGBTQ+-owned',
};

interface ParsedBusiness {
  business_id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  image: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  website: string;
  email: string;
  facebook: string;
  instagram: string;
  hours: string;
  photos: string[];
  ownership: string[];
  features: string[];
  lat: number | null;
  lng: number | null;
}

export function parseCSVRow(row: Record<string, string>): ParsedBusiness | null {
  try {
    const title = row['Title'] || row['title'] || '';
    if (!title || title.length < 2) return null;

    const categoryRaw = row['Business Type'] || row['cate'] || row['category'] || 'Shopping';
    let category = CATEGORY_MAPPING[categoryRaw] || categoryRaw;
    if (!category) category = 'Shopping';

    const locationRaw = row['Business Location'] || row['jet_tax__business-location'] || 'Ontario|Toronto';
    const [provincePart, cityPart] = parseLocation(locationRaw);
    
    const city = normalizeCity(cityPart || 'Toronto');
    const province = normalizeProvince(provincePart || 'ON');
    
    const addressRaw = row['address'] || '';
    const address = addressRaw || '';

    const descriptionRaw = row['business-description'] || row['Content'] || '';
    const description = stripHtml(descriptionRaw).substring(0, 500) || `Quality business in ${city}, ${province}`;

    const imageRaw = row['Image URL'] || row['Attachment URL'] || '';
    const mainImage = imageRaw.split('|')[0] || '';

    const phoneRaw = row['phone-numbe'] || row['phone'] || '';
    const phone = phoneRaw.replace(/[^\d]/g, '').substring(0, 15);

    const emailRaw = row['email'] || '';
    const websiteRaw = row['website'] || '';
    const website = websiteRaw.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');

    const facebook = row['facebook'] || '';
    const instagram = row['instagram'] || '';

    const hours = row['business-hours'] || '9:00 AM - 5:00 PM';

    const galleryRaw = row['gallery-'] || row['gallery'] || '';
    const photos = galleryRaw.split('|').filter((p: string) => p && p.startsWith('http')).slice(0, 5);
    if (mainImage && !photos.includes(mainImage)) {
      photos.unshift(mainImage);
    }

    const ownershipRaw = (row['Business Type'] || '').split('|')[0] || '';
    const ownership: string[] = [];
    for (const [key, label] of Object.entries(OWNERSHIP_MAPPING)) {
      if (ownershipRaw.includes(key)) {
        ownership.push(label);
      }
    }

    const cityData = CANADIAN_CITIES[city.toLowerCase() as CityKey];
    const lat = cityData?.coordinates?.lat || null;
    const lng = cityData?.coordinates?.lng || null;

    const subcategory = row['jet_tax__business-type'] || '';

    return {
      business_id: `rtm-${row['ID'] || row['id'] || Date.now()}`,
      name: title,
      category,
      subcategory,
      description,
      image: mainImage,
      address,
      city,
      province,
      phone,
      website,
      email: emailRaw,
      facebook,
      instagram,
      hours,
      photos,
      ownership,
      features: [],
      lat,
      lng,
    };
  } catch (error) {
    console.error('Error parsing CSV row:', error);
    return null;
  }
}

function parseLocation(raw: string): [string, string] {
  if (!raw) return ['ON', 'Toronto'];
  
  const parts = raw.split('|').map(p => p.trim());
  
  if (parts.length >= 2) {
    const provincePart = parts.find(p => isProvince(p)) || 'ON';
    const cityPart = parts.find(p => !isProvince(p)) || 'Toronto';
    return [provincePart, cityPart];
  }
  
  const single = parts[0] || 'Toronto';
  
  if (isProvince(single)) {
    return [single, 'Toronto'];
  }
  
  const matchedCity = Object.entries(CANADIAN_CITIES).find(
    ([key, data]) => key.toLowerCase() === single.toLowerCase() || data.name.toLowerCase() === single.toLowerCase()
  );
  
  if (matchedCity) {
    return [matchedCity[1].province, matchedCity[1].name];
  }
  
  return ['ON', single];
}

function isProvince(str: string): boolean {
  const provinces = ['Alberta', 'BC', 'British Columbia', 'Manitoba', 'NB', 'New Brunswick', 'Newfoundland', 'Nova Scotia', 'Ontario', 'PE', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon', 'AB', 'MB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
  return provinces.some(p => str.toLowerCase().includes(p.toLowerCase()));
}

function normalizeCity(city: string): string {
  const normalized = city
    .replace(/[,\s]+$/, '')
    .replace(/\s+Toronto$/i, '')
    .trim();
  
  const cityMap: Record<string, string> = {
    'toronto': 'Toronto',
    'north york': 'Toronto',
    'scarborough': 'Toronto',
    'etobicoke': 'Toronto',
    'ottawa-gatineau': 'Ottawa',
    'vancouver': 'Vancouver',
    'calgary': 'Calgary',
    'montreal': 'Montreal',
    'edmonton': 'Edmonton',
    'winnipeg': 'Winnipeg',
    'hamilton': 'Hamilton',
    'ottawa': 'Ottawa',
    'victoria': 'Victoria',
    'halifax': 'Halifax',
  };
  
  return cityMap[normalized.toLowerCase()] || 
         Object.entries(cityMap).find(([key]) => normalized.toLowerCase().includes(key))?.[1] ||
         normalized;
}

function normalizeProvince(province: string): string {
  const map: Record<string, string> = {
    'alberta': 'AB',
    'british columbia': 'BC',
    'manitoba': 'MB',
    'new brunswick': 'NB',
    'newfoundland': 'NL',
    'nova scotia': 'NS',
    'ontario': 'ON',
    'quebec': 'QC',
    'saskatchewan': 'SK',
    'yukon': 'YT',
    'prince edward island': 'PE',
    'northwest territories': 'NT',
    'nunavut': 'NU',
    'ab': 'AB',
    'bc': 'BC',
    'mb': 'MB',
    'nb': 'NB',
    'nl': 'NL',
    'ns': 'NS',
    'nt': 'NT',
    'nu': 'NU',
    'on': 'ON',
    'pe': 'PE',
    'qc': 'QC',
    'sk': 'SK',
    'yt': 'YT',
  };
  
  return map[province.toLowerCase()] || province.substring(0, 2).toUpperCase();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCSV(content: string): ParsedBusiness[] {
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const businesses: ParsedBusiness[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    const business = parseCSVRow(row);
    if (business) {
      businesses.push(business);
    }
  }
  
  return businesses;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function businessesToSQL(businesses: ParsedBusiness[]): string {
  const lines: string[] = [];
  
  lines.push(`-- Import ${businesses.length} businesses from RTM CSV`);
  lines.push(`-- Generated at ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`DO $$`);
  lines.push(`BEGIN`);
  lines.push(`  -- Clear existing RTM businesses to avoid duplicates`);
  lines.push(`  DELETE FROM public.businesses WHERE business_id LIKE 'rtm-%';`);
  lines.push(`END $$;`);
  lines.push('');
  lines.push(`COPY public.businesses (`);
  lines.push(`  business_id, name, category, subcategory, description,`);
  lines.push(`  image, address, city, province, phone, website,`);
  lines.push(`  lat, lng, features, ownership, photos,`);
  lines.push(`  is_verified, price_range, created_at`);
  lines.push(`) FROM stdin;`);
  
  for (const b of businesses) {
    const features = b.features.join('\\t') || '\\N';
    const ownership = b.ownership.join('\\t') || '\\N';
    const photos = b.photos.join('\\t') || '\\N';
    const now = new Date().toISOString();
    
    const row = [
      b.business_id,
      b.name,
      b.category,
      b.subcategory || '\\N',
      b.description,
      b.image,
      b.address,
      b.city,
      b.province,
      b.phone || '\\N',
      b.website || '\\N',
      b.lat?.toString() || '\\N',
      b.lng?.toString() || '\\N',
      features,
      ownership,
      photos,
      'true',
      '$$',
      now,
    ].join('\\t');
    
    lines.push(row);
  }
  
  lines.push('\\.');
  
  return lines.join('\n');
}
