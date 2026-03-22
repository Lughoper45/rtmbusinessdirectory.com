const fs = require('fs');

const migrationResults = JSON.parse(fs.readFileSync('image-migration-results.json', 'utf8'));

const urlMap = {};
migrationResults.forEach(r => {
  urlMap[r.id] = r.newUrl;
});

console.log(`Loaded ${Object.keys(urlMap).length} new image URLs`);

let content = fs.readFileSync('src/data/rtmBusinesses.ts', 'utf8');

const jsonMatch = content.match(/export const rtmBusinesses: Business\[\] = (.+);/s);
if (!jsonMatch) {
  console.error('Could not find business array');
  process.exit(1);
}

let businesses;
try {
  businesses = JSON.parse(jsonMatch[1]);
} catch (e) {
  console.error('JSON parse error:', e.message);
  process.exit(1);
}

let updatedCount = 0;
businesses.forEach(business => {
  const id = business.id.replace('rtm-', '');
  if (urlMap[id]) {
    business.image = urlMap[id];
    updatedCount++;
  }
});

const output = `import { Business } from "@/types/directory";

export const rtmBusinesses: Business[] = ${JSON.stringify(businesses, null, 2)};
`;

fs.writeFileSync('src/data/rtmBusinesses.ts', output);
console.log(`Updated ${updatedCount} businesses with new image URLs`);
