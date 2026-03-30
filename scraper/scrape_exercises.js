/**
 * MedBridge Exercise Video Scraper
 *
 * Queries the Algolia search index directly to get all 759 exercise videos,
 * then enriches each with the video embed URL and streaming URL.
 */

const ALGOLIA_APP_ID = '461G52AJ0S';
const ALGOLIA_API_KEY = '7fa45b287e7f6db8cfc0e31f02ae8d72';
const ALGOLIA_INDEX = 'exercises';
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries`;

const HITS_PER_PAGE = 100; // Algolia allows up to 1000

async function queryAlgolia(page) {
  const body = {
    requests: [{
      indexName: ALGOLIA_INDEX,
      params: `hitsPerPage=${HITS_PER_PAGE}&page=${page}`,
      facets: ['categories.lvl0'],
      highlightPostTag: '__/ais-highlight__',
      highlightPreTag: '__ais-highlight__',
      maxValuesPerFacet: 1000
    }]
  };

  const response = await fetch(`${ALGOLIA_URL}?x-algolia-api-key=${ALGOLIA_API_KEY}&x-algolia-application-id=${ALGOLIA_APP_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Algolia request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function cleanHit(hit) {
  return {
    id: hit.id,
    name: hit.name,
    type: hit.type,
    sample: hit.sample,
    description: hit.description,
    token: hit.token,
    category1: hit.category1 || hit['categories.lvl0'] || '',
    category2: hit.category2 || hit['categories.lvl1'] || '',
    thumbnail1: hit.thumbnail1 || '',
    thumbnail2: hit.thumbnail2 || '',
    objectID: hit.objectID,
    videoEmbedUrl: hit.token ? `https://www.medbridge.com/video/embed/${hit.token}` : null,
    videoStreamUrl: hit.token ? `https://video.medbridgeeducation.com/m3u8/${hit.token}.m3u8` : null,
  };
}

async function main() {
  console.log('Starting MedBridge exercise scraper...');

  // First request to get total count
  console.log('Querying page 0...');
  const firstResult = await queryAlgolia(0);
  const result = firstResult.results[0];

  const totalHits = result.nbHits;
  const totalPages = result.nbPages;

  console.log(`Total exercises: ${totalHits}`);
  console.log(`Total pages: ${totalPages} (${HITS_PER_PAGE} per page)`);

  // Collect first page hits
  let allExercises = result.hits.map(cleanHit);
  console.log(`Page 0: ${result.hits.length} hits (total collected: ${allExercises.length})`);

  // Fetch remaining pages
  for (let page = 1; page < totalPages; page++) {
    console.log(`Querying page ${page}...`);
    const pageResult = await queryAlgolia(page);
    const hits = pageResult.results[0].hits;
    allExercises = allExercises.concat(hits.map(cleanHit));
    console.log(`Page ${page}: ${hits.length} hits (total collected: ${allExercises.length})`);

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nTotal exercises collected: ${allExercises.length}`);

  // Verify uniqueness
  const uniqueIds = new Set(allExercises.map(e => e.id));
  const uniqueTokens = new Set(allExercises.map(e => e.token).filter(Boolean));
  console.log(`Unique exercise IDs: ${uniqueIds.size}`);
  console.log(`Unique video tokens: ${uniqueTokens.size}`);

  // Count by category
  const categories = {};
  for (const ex of allExercises) {
    const cat = ex.category1 || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  console.log('\nExercises by category:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Count samples vs non-samples
  const samples = allExercises.filter(e => e.sample).length;
  console.log(`\nSample exercises: ${samples}`);
  console.log(`Non-sample exercises: ${allExercises.length - samples}`);

  // Build output
  const output = {
    scrapeDate: new Date().toISOString(),
    source: 'https://www.medbridge.com/care/exercises',
    totalExercises: allExercises.length,
    uniqueIds: uniqueIds.size,
    uniqueVideoTokens: uniqueTokens.size,
    categories: categories,
    exercises: allExercises
  };

  // Write to file
  const fs = require('fs');
  const outputPath = __dirname + '/../data/medbridge_exercises.json';

  // Ensure data dir exists
  fs.mkdirSync(__dirname + '/../data', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\nData written to ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
