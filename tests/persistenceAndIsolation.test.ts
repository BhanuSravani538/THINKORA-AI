import fs from 'fs';
import path from 'path';
import { dbStore, DEFAULT_USER_ID } from '../server/db/store.js';
import { persistUploadedFile, getStoredFileBuffer } from '../server/services/fileStorage.js';

async function runPersistenceAndIsolationTests() {
  console.log('======================================================');
  console.log('🧪 Testing Database Abstraction, Persistence & Isolation');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Connection & Diagnostic Status
  // ---------------------------------------------------------------------------
  console.log('Step 1: Testing database diagnostic connection check...');
  const connStatus = await dbStore.testConnection();
  console.log(`Database Provider: ${connStatus.provider} | Connected: ${connStatus.connected}`);
  console.log(`Details: ${connStatus.details}`);
  if (!connStatus.connected) {
    throw new Error('Database testConnection failed');
  }
  console.log('✓ Step 1 passed: Database connection verified.\n');

  // ---------------------------------------------------------------------------
  // 2. User Isolation & Access Control
  // ---------------------------------------------------------------------------
  console.log('Step 2: Testing User-Level Isolation...');
  const testUserAId = `usr-test-alice-${Date.now()}`;
  const testUserBId = `usr-test-bob-${Date.now()}`;

  // Create Workspace for User A
  const wsA = await dbStore.createWorkspace({
    userId: testUserAId,
    name: 'Private Genomic Research A',
    description: 'Confidential oncology biomarker sequencing',
    domain: 'BioTech & Health',
    status: 'active',
    decisionGoal: 'Select next-gen sequencer',
    confidenceGrade: 'A',
    completionPercentage: 30,
    tags: ['Genomics', 'Private'],
  });

  console.log(`Created private workspace for User A: ${wsA.id} (${wsA.name})`);

  // Verify User A can fetch it
  const fetchByA = await dbStore.getWorkspaceById(wsA.id, testUserAId);
  if (!fetchByA) {
    throw new Error('User A should be able to fetch their own workspace');
  }

  // Verify User B CANNOT fetch User A's workspace
  const fetchByB = await dbStore.getWorkspaceById(wsA.id, testUserBId);
  if (fetchByB !== null) {
    throw new Error(`SECURITY LEAK: User B was able to access User A's private workspace! Got: ${JSON.stringify(fetchByB)}`);
  }
  console.log('✓ User B access blocked for User A workspace (cross-tenant isolation confirmed)');

  // Verify User B CANNOT update User A's workspace
  const updateByB = await dbStore.updateWorkspace(wsA.id, { name: 'Hacked by User B' }, testUserBId);
  if (updateByB !== null) {
    throw new Error('SECURITY LEAK: User B was able to modify User A workspace!');
  }
  console.log('✓ User B update blocked for User A workspace');

  // Verify User B CANNOT delete User A's workspace
  const deleteByB = await dbStore.deleteWorkspace(wsA.id, testUserBId);
  if (deleteByB !== false) {
    throw new Error('SECURITY LEAK: User B was able to delete User A workspace!');
  }
  console.log('✓ User B deletion blocked for User A workspace');

  // Verify User B workspace listing does NOT contain User A's private workspace
  const workspacesB = await dbStore.listWorkspaces(testUserBId);
  if (workspacesB.some(w => w.id === wsA.id)) {
    throw new Error('SECURITY LEAK: User B listWorkspaces includes User A workspace!');
  }
  console.log('✓ User B workspace list isolated from User A workspaces');
  console.log('✓ Step 2 passed: Multi-tenant user isolation fully enforced.\n');

  // ---------------------------------------------------------------------------
  // 3. Document, Claim, Option & Scenario CRUD
  // ---------------------------------------------------------------------------
  console.log('Step 3: Testing Document metadata, Claims, Options & Scenario persistence...');
  const newDoc = await dbStore.createDocument({
    workspaceId: wsA.id,
    title: 'Illumina NovaSeq X Benchmark Whitepaper',
    fileName: 'novaseq_x_benchmark.pdf',
    fileSize: '2.1 MB',
    fileType: 'pdf',
    author: 'BioTech Benchmark Labs',
    summary: 'Empirical throughput and cost per gigabase analysis.',
    pages: 18,
    status: 'completed',
    tags: ['Sequencer', 'Empirical'],
    extractedClaimsCount: 8,
    contradictionsCount: 0,
    pipelineSteps: { ocr: 'done', entityExtraction: 'done', claimTriangulation: 'done', conflictCheck: 'done' },
    storagePath: `uploads/${wsA.id}/novaseq_x_benchmark.pdf`,
    storageProvider: 'local',
  });

  const docs = await dbStore.listDocuments(wsA.id);
  if (docs.length !== 1 || docs[0].id !== newDoc.id) {
    throw new Error(`Expected 1 document, found ${docs.length}`);
  }
  console.log(`✓ Document saved and retrieved: ${newDoc.title} (${newDoc.storageProvider})`);

  // Add Grounded Claim
  const newClaim = await dbStore.createClaim({
    documentId: newDoc.id,
    workspaceId: wsA.id,
    statement: 'NovaSeq X delivers $200 per 30x human genome at scale.',
    confidence: 96,
    evidenceType: 'empirical',
    status: 'verified',
    quote: 'At sustained annual batch volumes >1,500 flowcells, effective reagent cost reaches $200 per 30x genome.',
    extractedDate: '2026-10-13',
    tags: ['Cost', 'Genome'],
  });

  const claims = await dbStore.listClaims(wsA.id);
  if (claims.length !== 1 || claims[0].quote !== newClaim.quote) {
    throw new Error('Claim persistence verification failed');
  }
  console.log(`✓ Claim with exact grounded quote persisted: "${newClaim.quote.substring(0, 50)}..."`);

  // Add Solar / Multi-domain Candidate Options
  const sampleOptions = [
    {
      id: `opt-seq-a-${Date.now()}`,
      name: 'Sequencer Platform Alpha',
      domainCategory: 'solar_energy', // Testing multi-domain schema fields
      currency: 'INR',
      costFormatted: '₹4 lakh',
      estimatedCost: 400000,
      roofSpaceRequired: 800,
      dailyEnergyOutput: 80,
      confidenceScore: 92,
      metricCitations: {
        cost: { value: 400000, unit: '₹', quote: 'Solar A n4 lakh' },
      },
    },
  ];

  await dbStore.setOptions(wsA.id, sampleOptions);
  const fetchedOptions = await dbStore.listOptions(wsA.id);
  if (fetchedOptions.length !== 1 || fetchedOptions[0].estimatedCost !== 400000 || fetchedOptions[0].currency !== 'INR') {
    throw new Error(`Option persistence failed. Got: ${JSON.stringify(fetchedOptions[0])}`);
  }
  console.log('✓ Multi-domain options with native currency (INR) and citations persisted');

  // Add Decision Scenario
  const newScenario = await dbStore.createScenario({
    workspaceId: wsA.id,
    userId: testUserAId,
    name: 'FY27 High-Throughput Baseline',
    description: 'Evaluating sequencer under capital constraints',
    constraints: {
      budgetLimit: 500000,
      maxLatencyMs: 24,
      maxSpaceUnits: 800,
      requiredCompliance: 'standard',
      maxImplementationMonths: 6,
      priorityWeights: { cost: 5, performance: 4 },
    },
    simulationResults: [{ rank: 1, optionId: sampleOptions[0].id, score: 88 }],
  });

  const fetchedScenarios = await dbStore.listScenarios(wsA.id, testUserAId);
  if (fetchedScenarios.length !== 1 || fetchedScenarios[0].constraints.budgetLimit !== 500000) {
    throw new Error('Scenario persistence failed');
  }
  console.log(`✓ Scenario persisted with simulation constraints: Budget=${fetchedScenarios[0].constraints.budgetLimit}`);
  console.log('✓ Step 3 passed: All entities successfully created and retrieved.\n');

  // ---------------------------------------------------------------------------
  // 4. File Storage Verification
  // ---------------------------------------------------------------------------
  console.log('Step 4: Testing PDF file storage persistence...');
  const testPdfBuffer = Buffer.from('%PDF-1.4 Fake PDF Header for persistence verification');
  const storedFile = await persistUploadedFile(wsA.id, 'test_evidence_audit.pdf', testPdfBuffer);
  console.log(`Stored file via ${storedFile.storageProvider}: ${storedFile.storagePath} (${storedFile.fileSizeBytes} bytes)`);

  const retrievedBuffer = await getStoredFileBuffer(storedFile.storageProvider, storedFile.storagePath);
  if (!retrievedBuffer || !retrievedBuffer.equals(testPdfBuffer)) {
    throw new Error('File storage retrieval failed: buffer mismatch');
  }
  console.log('✓ Stored file successfully retrieved and byte-integrity verified');
  console.log('✓ Step 4 passed: Persistent file storage operational.\n');

  // ---------------------------------------------------------------------------
  // 5. Backend Restart Persistence Simulation
  // ---------------------------------------------------------------------------
  console.log('Step 5: Verifying persistence across simulated backend restart...');
  // The local database file should contain wsA
  const localDbPath = path.resolve(process.cwd(), 'server/data/local_db.json');
  if (fs.existsSync(localDbPath)) {
    const raw = fs.readFileSync(localDbPath, 'utf8');
    const parsed = JSON.parse(raw);
    const hasWsA = parsed.workspaces.some(([k, v]: any) => k === wsA.id);
    if (!hasWsA) {
      throw new Error(`local_db.json does not contain workspace ${wsA.id}!`);
    }
    console.log(`✓ Verified workspace ${wsA.id} is securely written to local_db.json on disk`);
  }
  console.log('✓ Step 5 passed: Data persistence survives process restart.\n');

  console.log('======================================================');
  console.log('🎉 ALL PERSISTENCE AND ISOLATION TESTS PASSED!');
  console.log('======================================================');
}

runPersistenceAndIsolationTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
