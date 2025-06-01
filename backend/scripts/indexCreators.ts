const { esClient } = require('../src/lib/elasticsearch');
console.log('Script started');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/synthetic_influencers.json');
let creators: any[] = [];
try {
  const raw = fs.readFileSync(dataPath, 'utf-8');
  creators = JSON.parse(raw);
  console.log('Loaded creators:', creators.length);
} catch (err) {
  console.error('Failed to load or parse creators:', err);
  process.exit(1);
}

async function run() {
  for (const creator of creators) {
    try {
      await esClient.index({
        index: 'creators',
        id: String(creator.id),
        document: creator,
      });
      console.log(`Indexed creator: ${creator.id}`);
    } catch (err) {
      console.error(`Failed to index creator ${creator.id}:`, err);
    }
  }
  console.log('Creators indexed!');
}

run().catch(console.error);