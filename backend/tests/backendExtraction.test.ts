import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractOptionsAndClaimsFromPdf } from '../utils/documentOptionExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBackendExtraction() {
  console.log('Testing backend document ingestion pipeline on actual test PDF...');
  const samplePdf = path.resolve(__dirname, 'sample_docs/Campus_Solar_Energy_Planning.pdf');
  const buf = fs.readFileSync(samplePdf);
  const result = await extractOptionsAndClaimsFromPdf(
    buf,
    'Campus_Solar_Energy_Planning.pdf',
    'Test Research Paper: Campus Solar Energy Planning'
  );

  console.log(`Extracted Domain: ${result.domain}`);
  console.log(`Extracted Options Count: ${result.options.length}`);
  console.log(`Extracted Claims Count: ${result.claims.length}`);

  for (const opt of result.options) {
    console.log(`- Option: ${opt.name} | Cost: ${opt.costFormatted || opt.estimatedCost} | Space: ${opt.roofSpaceRequired} sq ft | Energy: ${opt.dailyEnergyOutput ?? 'Missing'} | InsufficientEvidence: ${opt.hasInsufficientEvidence}`);
  }

  if (result.options.length !== 3) {
    throw new Error(`Expected 3 options, got ${result.options.length}`);
  }

  const optC = result.options.find(o => o.name === 'Solar C');
  if (!optC || optC.estimatedCost !== null || optC.hasInsufficientEvidence !== true) {
    throw new Error('Solar C must preserve estimatedCost as null with hasInsufficientEvidence true');
  }

  console.log('Backend document ingestion pipeline verification: SUCCESS!');
}

testBackendExtraction().catch(err => {
  console.error('Backend extraction failed:', err);
  process.exit(1);
});
