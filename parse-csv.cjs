const fs = require('fs');

const csv = fs.readFileSync('Business-Export-2026-February-28-0602.csv', 'utf8');

const lines = csv.split('\n');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
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

const records = [];
let currentRecordLines = [];
let isFirstLine = true;

for (let idx = 0; idx < lines.length; idx++) {
  const line = lines[idx];
  const firstCell = line.split(',')[0]?.replace(/"/g, '').replace('\uFEFF', '').trim();
  const isNewRecord = /^\d+$/.test(firstCell);
  
  if (isFirstLine) {
    isFirstLine = false;
    continue;
  }
  
  if (isNewRecord) {
    if (currentRecordLines.length > 0) {
      records.push(currentRecordLines.join(' '));
    }
    currentRecordLines = [line];
  } else {
    currentRecordLines.push(line);
  }
}

if (currentRecordLines.length > 0) {
  records.push(currentRecordLines.join(' '));
}

console.log(`Found ${records.length} business records`);

const parsedBusinesses = records.map((line) => {
  const cols = parseCSVLine(line);
  
  const id = cols[0]?.replace('\uFEFF', '') || '';
  const title = cols[1] || '';
  const content = cols[2] || '';
  const imageUrl = cols[7] || '';
  const location = cols[15] || '';
  const businessType = cols[16] || '';
  const address = cols[22] || '';
  const phone = cols[24] || '';
  const website = cols[26] || '';
  
  const mainImage = imageUrl.split('|')[0] || '';
  
  let category = 'Other';
  if (businessType) {
    const parts = businessType.split('>');
    category = parts[0]?.trim() || 'Other';
  }
  
  let province = 'ON';
  let city = 'Toronto';
  
  if (location) {
    const locRaw = location.split('|')[0].split('>')[0].trim();
    const provinces = [
      { name: 'Ontario', abbr: 'ON' },
      { name: 'Alberta', abbr: 'AB' },
      { name: 'British Columbia', abbr: 'BC' },
      { name: 'Quebec', abbr: 'QC' },
      { name: 'Manitoba', abbr: 'MB' },
      { name: 'Nova Scotia', abbr: 'NS' },
      { name: 'New Brunswick', abbr: 'NB' },
      { name: 'Saskatchewan', abbr: 'SK' },
      { name: 'Prince Edward Island', abbr: 'PEI' },
      { name: 'Newfoundland', abbr: 'NL' }
    ];
    
    for (const p of provinces) {
      if (locRaw.toLowerCase().includes(p.name.toLowerCase())) {
        province = p.abbr;
        city = locRaw.replace(new RegExp(p.name, 'gi'), '').trim() || 'Toronto';
        break;
      }
    }
    
    if (province === 'ON' && city === 'Toronto') {
      const abbrMatch = locRaw.match(/\b(AB|BC|MB|NB|NL|NS|PEI|QC|SK)\b/i);
      if (abbrMatch) {
        province = abbrMatch[1].toUpperCase();
        city = locRaw.replace(/\b(AB|BC|MB|NB|NL|NS|PEI|QC|SK)\b/gi, '').trim() || 'Toronto';
      }
    }
  }
  
  const desc = content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);
  
  return {
    id: `rtm-${id}`,
    name: title,
    category: category,
    subcategory: businessType.split('>')[1]?.trim() || '',
    description: desc || `Quality business in ${city}, ${province}`,
    image: mainImage,
    rating: 0,
    reviewCount: 0,
    priceRange: '$$',
    address: address || city,
    city: city,
    province: province,
    distance: 0,
    isOpen: true,
    closingTime: '6:00 PM',
    isVerified: false,
    features: [],
    ownership: [],
    phone: phone,
    website: website,
    coordinates: null
  };
});

const output = `import { Business } from "@/types/directory";

export const rtmBusinesses: Business[] = ${JSON.stringify(parsedBusinesses, null, 2)};
`;

fs.writeFileSync('src/data/rtmBusinesses.ts', output);
console.log(`Written ${parsedBusinesses.length} businesses to src/data/rtmBusinesses.ts`);
