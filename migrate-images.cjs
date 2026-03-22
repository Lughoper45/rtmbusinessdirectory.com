const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://kajwpmyloxaqeciyndwf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthandwbXlsb3hhcWVjaXluZHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI3MzY5MiwiZXhwIjoyMDg3ODQ5NjkyfQ.OmYuCuvDf9uVgWJESKMvlqbl6ZhPMcbMbtBLsD3TYKM';

const csvPath = path.join(__dirname, 'Business-Export-2026-February-28-0602.csv');
const csv = fs.readFileSync(csvPath, 'utf8');
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

const businesses = records.map((line) => {
  const cols = parseCSVLine(line);
  return {
    id: cols[0]?.replace('\uFEFF', '') || '',
    name: cols[1] || '',
    imageUrl: cols[7]?.split('|')[0] || '',
    category: cols[16]?.split('>')[0]?.trim() || 'Other',
    city: 'Toronto',
    province: 'ON',
  };
}).filter(b => b.id && b.name && b.imageUrl);

console.log(`Found ${businesses.length} businesses with images`);

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function uploadToSupabase(buffer, filename) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/business-images/${filename}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/jpeg',
    },
    body: buffer
  });
  
  if (!response.ok) {
    const error = await response.text();
    if (response.status === 409) {
      console.log(`  ✓ Already exists`);
      return `${SUPABASE_URL}/storage/v1/object/public/business-images/${filename}`;
    }
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }
  
  return `${SUPABASE_URL}/storage/v1/object/public/business-images/${filename}`;
}

async function ensureBucket() {
  console.log('Checking/creating storage bucket...');
  
  try {
    const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'business-images',
        name: 'Business Images',
        public: true
      })
    });
    
    if (createRes.ok) {
      console.log('Bucket created successfully');
    } else {
      const error = await createRes.text();
      console.log('Bucket response:', createRes.status, error);
    }
  } catch (err) {
    console.log('Bucket creation error:', err.message);
  }
}

async function migrateImages() {
  await ensureBucket();
  
  const results = [];

if (fs.existsSync('image-migration-results.json')) {
  try {
    const existingResults = JSON.parse(fs.readFileSync('image-migration-results.json', 'utf8'));
    existingResults.forEach(r => {
      results.push(r);
    });
    console.log(`Loaded ${existingResults.length} existing results`);
  } catch(e) {
    console.log('Could not load existing results:', e.message);
  }
}

const existingIds = new Set(results.map(r => r.id));
console.log(`Already have ${existingIds.size} images`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    const filename = `rtm-${business.id}.jpg`;
  
  if (existingIds.has(business.id)) {
    console.log(`  - Already uploaded, skipping`);
    continue;
  }
  
  try {
      console.log(`[${i + 1}/${Math.min(businesses.length, 50)}] Downloading ${business.name}...`);
      
      const buffer = await downloadImage(business.imageUrl);
      const publicUrl = await uploadToSupabase(buffer, filename);
      
      results.push({
        id: business.id,
        name: business.name,
        oldUrl: business.imageUrl,
        newUrl: publicUrl
      });
      
      successCount++;
      console.log(`  ✓ Uploaded: ${publicUrl}`);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (err) {
      failCount++;
      if (err.message.includes('409')) {
        console.log(`  ✓ Already exists in storage: ${filename}`);
        results.push({
          id: business.id,
          name: business.name,
          oldUrl: business.imageUrl,
          newUrl: `${SUPABASE_URL}/storage/v1/object/public/business-images/${filename}`
        });
      } else {
        console.log(`  ✗ Failed: ${err.message}`);
      }
    }
  }
  
  console.log(`\n=== Migration Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total in file: ${results.length}`);
  
  fs.writeFileSync(
    'image-migration-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('Results saved to image-migration-results.json');
  
  return results;
}

migrateImages().catch(console.error);
