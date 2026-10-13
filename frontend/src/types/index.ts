export type WorkspaceStatus = 'active' | 'in_review' | 'simulated' | 'decision_ready';
export type ConfidenceGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';

export interface ResearchWorkspace {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: WorkspaceStatus;
  createdAt: string;
  lastActive: string;
  owner: string;
  tags: string[];
  completionPercentage: number;
  confidenceGrade: ConfidenceGrade;
  documentsCount: number;
  claimsCount: number;
  contradictionsCount: number;
  decisionGoal: string;
  defaultModelId?: string;
}

export type EvidenceType =
  | 'empirical'
  | 'vendor_sla'
  | 'third_party_benchmark'
  | 'internal_audit'
  | 'expert_opinion';

export type ClaimStatus = 'verified' | 'conflicted' | 'unverified';

export interface ClaimItem {
  id: string;
  docId: string;
  docTitle: string;
  statement: string;
  confidence: number; // 0-100
  evidenceType: EvidenceType;
  status: ClaimStatus;
  quote: string;
  extractedDate: string;
  relatedOptionId?: string;
  tags: string[];
}

export interface DocumentItem {
  id: string;
  workspaceId: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'xlsx' | 'docx' | 'json';
  uploadDate: string;
  status: 'completed' | 'processing' | 'failed' | 'extracting';
  pages: number;
  author: string;
  extractedClaimsCount: number;
  contradictionsCount: number;
  summary: string;
  tags: string[];
  pipelineSteps: {
    ocr: 'done' | 'running' | 'pending';
    entityExtraction: 'done' | 'running' | 'pending';
    claimTriangulation: 'done' | 'running' | 'pending';
    conflictCheck: 'done' | 'running' | 'pending';
  };
  claims?: ClaimItem[];
}

export interface SupportingEvidence {
  id: string;
  title: string;
  docTitle: string;
  quote: string;
  weight: number; // 1-10
  empiricalScore: number; // 0-100
  verifiedDate: string;
}

export interface ContradictionItem {
  id: string;
  title: string;
  description: string;
  sourceA: {
    docTitle: string;
    claim: string;
  };
  sourceB: {
    docTitle: string;
    claim: string;
  };
  severity: 'critical' | 'moderate' | 'low';
  impact: string;
  resolutionStatus: 'unresolved' | 'investigating' | 'dismissed' | 'resolved';
}

export interface ExtractedMetric {
  value: number | null; // null if missing / unknown
  unit: string;
  label: string;
  status: 'verified' | 'unverified' | 'missing' | 'estimated';
  formattedValue?: string;
  currency?: 'USD' | 'INR' | 'EUR' | 'GBP' | 'UNKNOWN';
  rawSourcePassage?: string;
  normalizedSourcePassage?: string;
  isCorruptedGlyph?: boolean;
  citation?: {
    docTitle: string;
    section?: string;
    quote: string;
    confidence: number;
  };
}

export interface DecisionOption {
  id: string;
  workspaceId: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;

  // Domain categorization & currency
  domainCategory?: 'cloud_infrastructure' | 'solar_energy' | 'general';
  currency?: 'USD' | 'INR';
  costFormatted?: string;

  // Standard / Cloud criteria (backward compatible)
  baseMonthlyCost: number; // in USD or native currency
  baseLatencyMs: number; // in milliseconds (p99)
  spaceRequiredUnits: number; // rack units / floor units / cloud quota units
  supportedCompliance: ('standard' | 'soc2_hipaa' | 'sovereign_airgap')[];
  implementationMonths: number;
  complexityLevel: 'low' | 'medium' | 'high';

  // Domain-specific criteria (Solar / Clean Energy)
  estimatedCost?: number | null; // total project CapEx (₹ for solar, $ for cloud)
  roofSpaceRequired?: number | null; // roof/canopy area in sq ft
  dailyEnergyOutput?: number | null; // generation in kWh/day (null = unknown)

  // Document evidence citations for extracted metrics
  metricCitations?: {
    cost?: ExtractedMetric;
    space?: ExtractedMetric;
    energyOutput?: ExtractedMetric;
    [key: string]: ExtractedMetric | undefined;
  };

  // Flag if option has insufficient evidence for deterministic decision making
  hasInsufficientEvidence?: boolean;
  missingCriteria?: string[];

  // Qualitative AI synthesis (kept separate from deterministic evaluation)
  pros: string[];
  cons: string[];
  confidenceScore: number;
  supportingEvidence: SupportingEvidence[];
  contradictions: ContradictionItem[];
  missingInfo: string[];
  riskFactors: string[];
  criteriaRatings: {
    costEfficiency: number;
    performance: number;
    scalability: number;
    compliance: number;
    reliability: number;
    timeToValue: number;
  };
}

export interface SimulationConstraints {
  // Budget constraint ($/mo for cloud or total project CapEx for solar)
  budgetLimit: number; // USD
  maxLatencyMs: number; // p99 ms
  maxSpaceUnits: number; // quota / rack units
  requiredCompliance: 'standard' | 'soc2_hipaa' | 'sovereign_airgap';
  maxImplementationMonths: number;
  maxComplexity: 'low' | 'medium' | 'high';

  // Solar / Clean Energy constraints
  currency?: 'USD' | 'INR';
  availableRoofSpace?: number; // sq ft (e.g. 1,000 sq ft)
  minDailyEnergyDemand?: number; // kWh/day (e.g. 75 kWh/day)

  priorityWeights: {
    cost: number; // 1 to 5
    performance: number; // or energy yield
    compliance: number; // or space efficiency
    timeToValue: number;
    risk: number;
    spaceEfficiency?: number;
  };
}

export interface OptionSimulationResult {
  optionId: string;
  isEligible: boolean;
  status: 'eligible' | 'at_risk' | 'disqualified' | 'insufficient_evidence';
  reasons: string[]; // Hard constraint violations
  warningReasons: string[]; // Weighted preference warnings
  missingDataReasons?: string[]; // Missing criteria reasons
  compositeScore: number;
  costScore: number;
  performanceScore: number; // or energy yield score
  complianceScore: number;
  timeScore: number;
  rank: number;
}

export interface ActivityItem {
  id: string;
  type: 'claim_extracted' | 'contradiction_found' | 'simulation_run' | 'doc_uploaded' | 'matrix_updated';
  title: string;
  description: string;
  timestamp: string;
  workspaceId: string;
  workspaceName: string;
  severity?: 'info' | 'warning' | 'alert' | 'success';
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  iconName: string;
  constraints: SimulationConstraints;
}

export type GraphNodeType = 'hypothesis' | 'claim' | 'source' | 'contradiction' | 'option';

export interface GraphNodeData {
  id: string;
  label: string;
  type: GraphNodeType;
  subtitle?: string;
  confidence?: number;
  status?: string;
  severity?: 'critical' | 'moderate' | 'low';
  tags?: string[];
  docTitle?: string;
  quote?: string;
  score?: number;
  connectionsCount?: number;
  [key: string]: unknown;
}

// -------------------------------------------------------------
// Evidence Completeness Indicator Types (THINKORA)
// -------------------------------------------------------------

export type CriterionVerificationStatus =
  | 'available_source_linked' // Available and source-linked
  | 'extracted_unverified'    // Extracted but unverified
  | 'conflicting_evidence'    // Conflicting evidence
  | 'missing_information'     // Missing information
  | 'not_applicable';         // Not applicable

export interface OptionCriterionCompleteness {
  id: string;
  label: string;
  category: 'critical' | 'important' | 'operational';
  status: CriterionVerificationStatus;
  statusLabel: string;
  extractedValue?: string | number | null;
  unit?: string;
  rawSourcePassage?: string;
  sourceDocument?: string;
  sourceSection?: string;
  pageNumber?: number;
  importanceExplanation: string;
  recommendation?: string;
  isCritical: boolean;
  confidenceScore?: number;
}

export interface OptionCompletenessSummary {
  optionId: string;
  optionName: string;
  domainCategory: 'solar_energy' | 'cloud_infrastructure' | 'general';
  totalCriteria: number;
  availableCount: number;
  unverifiedCount: number;
  conflictingCount: number;
  missingCount: number;
  notApplicableCount: number;
  completenessPercentage: number;
  criteria: OptionCriterionCompleteness[];
  criticalMissing: OptionCriterionCompleteness[];
  decisionReadiness: 'decision_ready' | 'conditional' | 'insufficient_evidence';
  summaryRecommendation: string;
}

