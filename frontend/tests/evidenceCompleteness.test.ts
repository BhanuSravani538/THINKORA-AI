import { evaluateSolarOptionCompleteness, evaluateCloudOptionCompleteness } from '../src/utils/evidenceCompleteness.js';
import { getCampusSolarOptions } from '../src/utils/documentOptionExtractor.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runCompletenessTests() {
  console.log('--- RUNNING THINKORA EVIDENCE COMPLETENESS TESTS ---');

  const solarOptions = getCampusSolarOptions('ws-solar-001');
  const optA = solarOptions.find(o => o.name === 'Solar A')!;
  const optB = solarOptions.find(o => o.name === 'Solar B')!;
  const optC = solarOptions.find(o => o.name === 'Solar C')!;

  assert(!!optA && !!optB && !!optC, 'All 3 solar options must exist');

  // Test 1: Solar A Completeness
  console.log('1. Testing Solar A completeness evaluation...');
  const compA = evaluateSolarOptionCompleteness(optA);
  assert(compA.totalCriteria === 7, `Expected 7 criteria, got ${compA.totalCriteria}`);
  assert(compA.availableCount === 3, `Expected 3 available criteria, got ${compA.availableCount}`);
  assert(compA.missingCount === 4, `Expected 4 missing criteria, got ${compA.missingCount}`);
  assert(compA.criticalMissing.length === 0, `Solar A should not have critical missing criteria`);
  assert(compA.decisionReadiness === 'conditional', `Expected conditional, got ${compA.decisionReadiness}`);
  assert(compA.completenessPercentage === 43, `Expected 43%, got ${compA.completenessPercentage}`);

  // Test 2: Solar B Completeness
  console.log('2. Testing Solar B completeness evaluation...');
  const compB = evaluateSolarOptionCompleteness(optB);
  assert(compB.availableCount === 3, `Expected 3 available criteria, got ${compB.availableCount}`);
  assert(compB.criticalMissing.length === 0, `Solar B should not have critical missing criteria`);
  assert(compB.decisionReadiness === 'conditional', `Expected conditional, got ${compB.decisionReadiness}`);

  // Test 3: Solar C Incomplete Candidate (Missing Installation Cost)
  console.log('3. Testing Solar C critical missing detection (Cost missing)...');
  const compC = evaluateSolarOptionCompleteness(optC);
  assert(compC.availableCount === 2, `Expected 2 available criteria for Solar C, got ${compC.availableCount}`);
  assert(compC.criticalMissing.length === 1, `Solar C must have 1 critical missing criterion, got ${compC.criticalMissing.length}`);
  assert(compC.criticalMissing[0].id === 'installation_cost', `Critical missing must be installation_cost`);
  assert(compC.decisionReadiness === 'insufficient_evidence', `Solar C must have decisionReadiness 'insufficient_evidence'`);
  assert(compC.completenessPercentage === 29, `Expected 29%, got ${compC.completenessPercentage}`);

  // Test 4: Inspection of Supporting Source Passages
  console.log('4. Verifying source passage and recommendation integrity...');
  const costCriterionA = compA.criteria.find(c => c.id === 'installation_cost')!;
  assert(costCriterionA.rawSourcePassage?.includes('Solar A n4 lakh'), `Passage must preserve original PDF text`);
  assert(costCriterionA.sourceSection === 'Table 1: Comparative Solar Assessment', `Section must match source document`);

  const seasonalCriterion = compA.criteria.find(c => c.id === 'seasonal_variability')!;
  assert(seasonalCriterion.status === 'missing_information', `Seasonal variability must be marked as missing`);
  assert(seasonalCriterion.recommendation?.includes('PVWatts') || seasonalCriterion.recommendation?.includes('seasonal generation estimates'), `Must offer actionable recommendation for seasonal data`);
  assert(seasonalCriterion.importanceExplanation.length > 20, `Must explain why missing seasonal info matters`);

  // Test 5: Distinction between missing and zero
  console.log('5. Ensuring missing value is distinct from zero...');
  assert(compC.criteria.find(c => c.id === 'installation_cost')?.extractedValue === null, `Missing cost must be null, not 0`);

  // Test 6: Cloud Architecture Option Completeness
  console.log('6. Testing Cloud Infrastructure completeness evaluation...');
  const cloudOptionMock = {
    ...optA,
    id: 'opt-k8s',
    name: 'Multi-Region Kubernetes',
    domainCategory: 'cloud_infrastructure' as const,
    baseMonthlyCost: 4200,
    baseLatencyMs: 38,
    spaceRequiredUnits: 12,
    supportedCompliance: ['standard', 'soc2_hipaa'] as ('standard' | 'soc2_hipaa')[],
    implementationMonths: 3,
  };
  const compCloud = evaluateCloudOptionCompleteness(cloudOptionMock);
  assert(compCloud.totalCriteria === 7, `Expected 7 cloud criteria, got ${compCloud.totalCriteria}`);
  assert(compCloud.availableCount >= 5, `Expected >= 5 available criteria for mock cloud option`);
  assert(compCloud.decisionReadiness === 'conditional' || compCloud.decisionReadiness === 'decision_ready');

  console.log('✅ ALL EVIDENCE COMPLETENESS TESTS PASSED SUCCESSFULLY!');
}

runCompletenessTests();
