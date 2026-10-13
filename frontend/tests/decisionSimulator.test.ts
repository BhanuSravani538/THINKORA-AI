import { evaluateOption, evaluateAllOptions } from '../src/utils/decisionEngine.js';
import { getCampusSolarOptions } from '../src/utils/documentOptionExtractor.js';
import { MOCK_DECISION_OPTIONS, DEFAULT_CONSTRAINTS } from '../src/data/mockData.js';
import { SimulationConstraints } from '../src/types/index.js';

function runTests() {
  console.log('===============================================================');
  console.log('🧪 THINKORA Decision Simulator Test Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  const solarOptions = getCampusSolarOptions('ws-solar-campus');
  const solarA = solarOptions.find(o => o.id === 'opt-solar-a')!;
  const solarB = solarOptions.find(o => o.id === 'opt-solar-b')!;
  const solarC = solarOptions.find(o => o.id === 'opt-solar-c')!;

  // ---------------------------------------------------------------------------
  // TEST 1: Budget Violation (Source Document: Solar B exceeds ₹5 lakh budget)
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: Budget Violation ---');
  const budgetConstraints: SimulationConstraints = {
    budgetLimit: 500000, // ₹5 Lakh budget (Finding 2 baseline)
    availableRoofSpace: 1000,
    minDailyEnergyDemand: 75,
    currency: 'INR',
    maxLatencyMs: 0,
    maxSpaceUnits: 0,
    requiredCompliance: 'standard',
    maxImplementationMonths: 12,
    maxComplexity: 'medium',
    priorityWeights: { cost: 4, performance: 5, compliance: 4, timeToValue: 3, risk: 4 },
  };

  const resSolarB = evaluateOption(solarB, budgetConstraints);
  assert(
    !resSolarB.isEligible && resSolarB.status === 'disqualified',
    'Solar B (₹6 lakh) is disqualified when budget limit is ₹5 lakh'
  );
  assert(
    resSolarB.reasons.some(r => r.includes('Budget violation') && (r.includes('1 lakh') || r.includes('100,000'))),
    'Disqualification reason clearly states budget overage of +₹1 lakh'
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Space / Roof Space Violation
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: Roof Space Violation ---');
  const spaceConstraints: SimulationConstraints = {
    budgetLimit: 700000,
    availableRoofSpace: 700, // 700 sq. ft. limit
    minDailyEnergyDemand: 75,
    currency: 'INR',
    maxLatencyMs: 0,
    maxSpaceUnits: 0,
    requiredCompliance: 'standard',
    maxImplementationMonths: 12,
    maxComplexity: 'medium',
    priorityWeights: { cost: 4, performance: 5, compliance: 4, timeToValue: 3, risk: 4 },
  };

  const resSolarA_Space = evaluateOption(solarA, spaceConstraints);
  assert(
    !resSolarA_Space.isEligible && resSolarA_Space.status === 'disqualified',
    'Solar A (800 sq. ft.) is disqualified when roof space is 700 sq. ft.'
  );
  assert(
    resSolarA_Space.reasons.some(r => r.includes('Space violation') && r.includes('+100 sq ft')),
    'Disqualification reason clearly identifies 100 sq. ft. space overage'
  );

  const resSolarB_Space = evaluateOption(solarB, spaceConstraints);
  assert(
    resSolarB_Space.isEligible && (solarB.roofSpaceRequired ?? 0) <= 700,
    'Solar B (600 sq. ft.) satisfies 700 sq. ft. space limit'
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Minimum Daily Energy Demand Requirement
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: Minimum Daily Energy Demand Requirement ---');
  const energyConstraints: SimulationConstraints = {
    budgetLimit: 700000,
    availableRoofSpace: 1000,
    minDailyEnergyDemand: 100, // 100 kWh/day minimum demand
    currency: 'INR',
    maxLatencyMs: 0,
    maxSpaceUnits: 0,
    requiredCompliance: 'standard',
    maxImplementationMonths: 12,
    maxComplexity: 'medium',
    priorityWeights: { cost: 4, performance: 5, compliance: 4, timeToValue: 3, risk: 4 },
  };

  const resSolarA_Energy = evaluateOption(solarA, energyConstraints);
  assert(
    !resSolarA_Energy.isEligible && resSolarA_Energy.status === 'disqualified',
    'Solar A (80 kWh/day) is disqualified when demand ceiling is 100 kWh/day'
  );
  assert(
    resSolarA_Energy.reasons.some(r => r.includes('Energy requirement violation') && r.includes('-20 kWh/day deficit')),
    'Disqualification reason explicitly notes -20 kWh/day deficit'
  );

  const resSolarB_Energy = evaluateOption(solarB, energyConstraints);
  assert(
    resSolarB_Energy.isEligible,
    'Solar B (110 kWh/day) comfortably satisfies 100 kWh/day demand'
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Missing Values and Insufficient Evidence (Solar C Cost Not Reported)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 4: Missing Values & Insufficient Evidence ---');
  assert(
    solarC.estimatedCost === null,
    'Solar C has estimatedCost as null (not reported in document), not an invented number'
  );
  assert(
    solarC.hasInsufficientEvidence === true,
    'Solar C is explicitly marked hasInsufficientEvidence = true'
  );

  const resSolarC = evaluateOption(solarC, budgetConstraints);
  assert(
    resSolarC.status === 'insufficient_evidence',
    'Solar C evaluation status is "insufficient_evidence"'
  );
  assert(
    resSolarC.isEligible === false,
    'Solar C is marked not eligible due to missing critical evaluation criteria'
  );
  assert(
    resSolarC.missingDataReasons!.some(r => r.includes('Cost is not reported')),
    'Explicit missing data notice generated without fabricating cost figures'
  );

  // ---------------------------------------------------------------------------
  // TEST 5: Deterministic Ranking Changes When Constraints Change
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 5: Ranking Recalculation When Constraints Change ---');
  // Scenario A: Baseline budget (₹5 lakh) -> Solar A is Rank #1, Solar B is disqualified
  const baselineSim = evaluateAllOptions(solarOptions, budgetConstraints);
  assert(
    baselineSim[0].optionId === 'opt-solar-a' && baselineSim[0].rank === 1 && baselineSim[0].isEligible,
    'Under ₹5 lakh budget, Solar A (₹4 lakh) is Rank #1 eligible winner'
  );
  assert(
    baselineSim.find(r => r.optionId === 'opt-solar-b')!.isEligible === false,
    'Under ₹5 lakh budget, Solar B (₹6 lakh) is disqualified'
  );

  // Scenario B: User expands budget to ₹7 lakh -> Solar B becomes eligible and takes Rank #1
  const expandedBudgetConstraints: SimulationConstraints = {
    ...budgetConstraints,
    budgetLimit: 700000, // Expand budget to ₹7 lakh
    availableRoofSpace: 1000,
    minDailyEnergyDemand: 75,
  };
  const expandedSim = evaluateAllOptions(solarOptions, expandedBudgetConstraints);
  assert(
    expandedSim.find(r => r.optionId === 'opt-solar-b')!.isEligible === true,
    'When budget expands to ₹7 lakh, Solar B becomes eligible'
  );
  assert(
    expandedSim[0].optionId === 'opt-solar-b' && expandedSim[0].rank === 1,
    'When budget expands to ₹7 lakh, Solar B (110 kWh/day) outranks Solar A and becomes Rank #1'
  );
  assert(
    expandedSim[1].optionId === 'opt-solar-a' && expandedSim[1].rank === 2,
    'Solar A becomes Rank #2'
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Evidence Citations Provenance Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 6: Evidence Citations Provenance Verification ---');
  assert(
    solarA.metricCitations?.cost?.citation?.quote.includes('Solar A') === true &&
    solarA.supportingEvidence[0].quote.includes('Finding 1'),
    'Solar A citations match exact text and Finding 1 from source paper'
  );
  assert(
    solarB.metricCitations?.cost?.citation?.quote.includes('Solar B') === true &&
    solarB.supportingEvidence[0].quote.includes('Finding 2'),
    'Solar B citations match exact text and Finding 2 from source paper'
  );
  assert(
    solarC.metricCitations?.cost?.citation?.quote.includes('Not reported') === true &&
    solarC.supportingEvidence[0].quote.includes('Finding 3'),
    'Solar C citations accurately cite Not reported and Finding 3'
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Empty Workspace Handling
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 7: Empty Workspace Handling ---');
  const emptySim = evaluateAllOptions([], budgetConstraints);
  assert(
    Array.isArray(emptySim) && emptySim.length === 0,
    'Evaluating empty options list returns empty simulation results without throwing'
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Cloud Infrastructure Demo Preservation (Regression Check)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 8: Cloud Infrastructure Preservation ---');
  const cloudOptions = MOCK_DECISION_OPTIONS.filter(o => o.domainCategory !== 'solar_energy');
  const cloudSim = evaluateAllOptions(cloudOptions, DEFAULT_CONSTRAINTS);
  assert(
    cloudOptions.length === 3,
    'Existing 3 cloud infrastructure options preserved in demo'
  );
  assert(
    cloudSim[0].optionId === 'opt-hybrid-k8s' && cloudSim[0].isEligible,
    'Cloud simulator preserves Hybrid K8s as top eligible recommendation'
  );
  assert(
    cloudSim.find(r => r.optionId === 'opt-serverless')!.reasons.length > 0,
    'Cloud simulator correctly flags Serverless budget and latency violations'
  );

  console.log('\n===============================================================');
  console.log(`🏁 Test Summary: ${passed} / ${total} tests passed.`);
  console.log('===============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
