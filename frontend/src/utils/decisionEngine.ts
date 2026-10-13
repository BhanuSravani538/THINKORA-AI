import { DecisionOption, SimulationConstraints, OptionSimulationResult } from '../types';

/**
 * Evaluates Solar / Clean Energy candidate options using transparent, deterministic rules.
 * Clearly separates hard constraint violations from weighted preference scoring.
 */
export function evaluateSolarOption(
  option: DecisionOption,
  constraints: SimulationConstraints
): OptionSimulationResult {
  const disqualifications: string[] = [];
  const warnings: string[] = [];
  const missingDataReasons: string[] = [];

  const isINR = option.currency === 'INR' || constraints.currency === 'INR' || option.estimatedCost !== undefined;
  const currSym = isINR ? '₹' : '$';

  const formatCost = (amt: number): string => {
    if (isINR) {
      if (amt >= 100000) {
        const lakhs = (amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1);
        return `₹${lakhs} lakh (₹${amt.toLocaleString()})`;
      }
      return `₹${amt.toLocaleString()}`;
    }
    return `$${amt.toLocaleString()}`;
  };

  const budgetLimit = constraints.budgetLimit;
  const availableRoofSpace = constraints.availableRoofSpace ?? 1000; // in sq ft
  const minDailyEnergyDemand = constraints.minDailyEnergyDemand ?? 75; // in kWh/day

  // ---------------------------------------------------------------------------
  // 1. HARD CONSTRAINT: Budget Envelope
  // ---------------------------------------------------------------------------
  if (option.estimatedCost !== null && option.estimatedCost !== undefined) {
    if (option.estimatedCost > budgetLimit) {
      const overage = option.estimatedCost - budgetLimit;
      disqualifications.push(
        `Budget violation: Estimated cost of ${formatCost(option.estimatedCost)} exceeds budget limit of ${formatCost(budgetLimit)} by +${formatCost(overage)}`
      );
    } else if (option.estimatedCost > budgetLimit * 0.9) {
      warnings.push(
        `Budget utilization high: Consumes ${Math.round((option.estimatedCost / budgetLimit) * 100)}% of total capital expenditure (${formatCost(option.estimatedCost)} / ${formatCost(budgetLimit)})`
      );
    }
  } else {
    // Preserved as unknown / missing without fabricating data
    missingDataReasons.push('Cost is not reported in document — cannot evaluate against budget constraint');
    disqualifications.push('Insufficient evidence: Cost is not reported; cannot evaluate financial feasibility');
  }

  // ---------------------------------------------------------------------------
  // 2. HARD CONSTRAINT: Available Roof Space Footprint
  // ---------------------------------------------------------------------------
  if (option.roofSpaceRequired !== null && option.roofSpaceRequired !== undefined) {
    if (option.roofSpaceRequired > availableRoofSpace) {
      const overage = option.roofSpaceRequired - availableRoofSpace;
      disqualifications.push(
        `Space violation: Requires ${option.roofSpaceRequired.toLocaleString()} sq ft, exceeding available roof space of ${availableRoofSpace.toLocaleString()} sq ft by +${overage.toLocaleString()} sq ft`
      );
    } else if (option.roofSpaceRequired > availableRoofSpace * 0.9) {
      warnings.push(
        `Space footprint tight: Occupies ${Math.round((option.roofSpaceRequired / availableRoofSpace) * 100)}% of available roof footprint`
      );
    }
  } else {
    missingDataReasons.push('Required roof footprint is unknown / not documented in evidence');
    disqualifications.push('Insufficient evidence: Required space footprint is missing from document');
  }

  // ---------------------------------------------------------------------------
  // 3. HARD CONSTRAINT: Minimum Daily Energy Demand
  // ---------------------------------------------------------------------------
  if (option.dailyEnergyOutput !== null && option.dailyEnergyOutput !== undefined) {
    if (option.dailyEnergyOutput < minDailyEnergyDemand) {
      const deficit = minDailyEnergyDemand - option.dailyEnergyOutput;
      disqualifications.push(
        `Energy requirement violation: Generates ${option.dailyEnergyOutput} kWh/day, failing minimum daily demand of ${minDailyEnergyDemand} kWh/day (-${deficit} kWh/day deficit)`
      );
    } else if (option.dailyEnergyOutput < minDailyEnergyDemand * 1.05) {
      warnings.push(
        `Energy yield buffer narrow: ${option.dailyEnergyOutput} kWh/day is near minimum demand threshold (${minDailyEnergyDemand} kWh/day)`
      );
    }
  } else {
    // Missing critical criteria: Mark as insufficient evidence rather than fabricating values
    missingDataReasons.push('Daily energy output is unknown in uploaded document');
    disqualifications.push(
      `Insufficient evidence: Daily energy output is unknown; cannot verify minimum demand of ${minDailyEnergyDemand} kWh/day`
    );
  }

  // Contradiction warnings
  const criticalContradictions = option.contradictions?.filter(c => c.severity === 'critical') || [];
  if (criticalContradictions.length > 0) {
    warnings.push(
      `Contains ${criticalContradictions.length} unresolved critical empirical contradiction${criticalContradictions.length > 1 ? 's' : ''}`
    );
  }

  const isDisqualified = disqualifications.length > 0;
  const hasMissingData = missingDataReasons.length > 0 || !!option.hasInsufficientEvidence;
  const isAtRisk = !isDisqualified && warnings.length > 0;

  const status: 'eligible' | 'at_risk' | 'disqualified' | 'insufficient_evidence' =
    hasMissingData
      ? 'insufficient_evidence'
      : isDisqualified
      ? 'disqualified'
      : isAtRisk
      ? 'at_risk'
      : 'eligible';

  // ---------------------------------------------------------------------------
  // 4. WEIGHTED PREFERENCE SCORING (Deterministic 0-100)
  // ---------------------------------------------------------------------------
  // Cost score: Lower cost relative to budget = higher score
  const costScore =
    option.estimatedCost !== null && option.estimatedCost !== undefined
      ? Math.max(10, Math.min(100, Math.round(100 - (option.estimatedCost / budgetLimit) * 50)))
      : 20;

  // Energy generation score: Higher output = higher score (normalized against max anticipated 130 kWh/day)
  const energyScore =
    option.dailyEnergyOutput !== null && option.dailyEnergyOutput !== undefined
      ? Math.max(10, Math.min(100, Math.round((option.dailyEnergyOutput / 130) * 100)))
      : 15;

  // Space efficiency score: Output density relative to space limit
  const spaceScore =
    option.roofSpaceRequired !== null && option.roofSpaceRequired !== undefined
      ? Math.max(10, Math.min(100, Math.round(100 - (option.roofSpaceRequired / (availableRoofSpace * 1.5)) * 60)))
      : 20;

  const confidenceScore = option.confidenceScore || 70;

  const weights = constraints.priorityWeights;
  const costWeight = weights.cost;
  const energyWeight = weights.performance; // Map performance to energy yield in solar
  const spaceWeight = weights.spaceEfficiency || weights.compliance;
  const riskWeight = weights.risk;

  const totalWeight = costWeight + energyWeight + spaceWeight + riskWeight;

  const rawWeightedScore =
    (costScore * costWeight +
      energyScore * energyWeight +
      spaceScore * spaceWeight +
      confidenceScore * riskWeight) /
    totalWeight;

  let compositeScore = Math.max(5, Math.round(rawWeightedScore));

  // If insufficient evidence or disqualified, apply deterministic display penalty
  if (status === 'insufficient_evidence') {
    compositeScore = Math.min(32, Math.round(compositeScore * 0.35));
  } else if (isDisqualified) {
    compositeScore = Math.min(48, Math.round(compositeScore * 0.5));
  } else if (isAtRisk) {
    compositeScore = Math.round(compositeScore * 0.9);
  }

  return {
    optionId: option.id,
    isEligible: !isDisqualified && !hasMissingData,
    status,
    reasons: disqualifications,
    warningReasons: warnings,
    missingDataReasons,
    compositeScore,
    costScore,
    performanceScore: energyScore,
    complianceScore: spaceScore,
    timeScore: 80,
    rank: 0,
  };
}

/**
 * Evaluates Cloud Infrastructure candidate options (Enterprise Architecture)
 */
export function evaluateCloudOption(
  option: DecisionOption,
  constraints: SimulationConstraints
): OptionSimulationResult {
  const disqualifications: string[] = [];
  const warnings: string[] = [];

  // 1. Budget evaluation
  const budgetRatio = option.baseMonthlyCost / constraints.budgetLimit;
  if (option.baseMonthlyCost > constraints.budgetLimit) {
    const overage = option.baseMonthlyCost - constraints.budgetLimit;
    disqualifications.push(
      `Budget violation: $${(option.baseMonthlyCost / 1000).toFixed(1)}k/mo exceeds limit of $${(constraints.budgetLimit / 1000).toFixed(1)}k/mo by +$${(overage / 1000).toFixed(1)}k`
    );
  } else if (budgetRatio > 0.88) {
    warnings.push(
      `Budget near ceiling: Utilizes ${(budgetRatio * 100).toFixed(0)}% of monthly budget envelope ($${(option.baseMonthlyCost / 1000).toFixed(1)}k / $${(constraints.budgetLimit / 1000).toFixed(1)}k)`
    );
  }

  // 2. Latency / Performance evaluation
  if (option.baseLatencyMs > constraints.maxLatencyMs) {
    const latencyGap = option.baseLatencyMs - constraints.maxLatencyMs;
    disqualifications.push(
      `Performance violation: p99 latency of ${option.baseLatencyMs}ms exceeds target ceiling of ${constraints.maxLatencyMs}ms (+${latencyGap}ms)`
    );
  } else if (option.baseLatencyMs > constraints.maxLatencyMs * 0.85) {
    warnings.push(
      `Latency buffer thin: ${option.baseLatencyMs}ms is close to ${constraints.maxLatencyMs}ms SLA limit`
    );
  }

  // 3. Space / Physical footprint evaluation
  if (option.spaceRequiredUnits > constraints.maxSpaceUnits) {
    const spaceGap = option.spaceRequiredUnits - constraints.maxSpaceUnits;
    disqualifications.push(
      `Space/Footprint violation: Requires ${option.spaceRequiredUnits} rack units, exceeding available capacity of ${constraints.maxSpaceUnits} units (+${spaceGap} units)`
    );
  }

  // 4. Compliance evaluation
  if (constraints.requiredCompliance === 'sovereign_airgap') {
    if (!option.supportedCompliance.includes('sovereign_airgap')) {
      disqualifications.push(
        'Compliance violation: Fails Sovereign Air-Gap requirement (only supports ' +
          option.supportedCompliance.join(', ') +
          ')'
      );
    }
  } else if (constraints.requiredCompliance === 'soc2_hipaa') {
    if (
      !option.supportedCompliance.includes('soc2_hipaa') &&
      !option.supportedCompliance.includes('sovereign_airgap')
    ) {
      disqualifications.push(
        'Compliance violation: Fails mandatory SOC2 / HIPAA regulatory attestation requirement'
      );
    }
  }

  // 5. Timeline evaluation
  if (option.implementationMonths > constraints.maxImplementationMonths) {
    const delay = option.implementationMonths - constraints.maxImplementationMonths;
    disqualifications.push(
      `Timeline violation: ${option.implementationMonths} months deployment window exceeds deadline of ${constraints.maxImplementationMonths} months (+${delay} mo)`
    );
  }

  // 6. Complexity evaluation
  const complexityRank = { low: 1, medium: 2, high: 3 };
  const maxComplexityRank = complexityRank[constraints.maxComplexity];
  const optionComplexityRank = complexityRank[option.complexityLevel];

  if (optionComplexityRank > maxComplexityRank) {
    warnings.push(
      `Operational complexity (${option.complexityLevel.toUpperCase()}) exceeds team comfort limit (${constraints.maxComplexity.toUpperCase()})`
    );
  }

  // Contradiction severity warning
  const criticalContradictions = option.contradictions?.filter(c => c.severity === 'critical') || [];
  if (criticalContradictions.length > 0) {
    warnings.push(
      `Contains ${criticalContradictions.length} unresolved critical empirical contradiction${criticalContradictions.length > 1 ? 's' : ''}`
    );
  }

  const isDisqualified = disqualifications.length > 0;
  const isAtRisk = !isDisqualified && warnings.length > 0;
  const status: 'eligible' | 'at_risk' | 'disqualified' = isDisqualified
    ? 'disqualified'
    : isAtRisk
    ? 'at_risk'
    : 'eligible';

  // Sub-Scores normalized 0-100
  const costScore = Math.max(
    10,
    Math.min(100, Math.round(100 - (option.baseMonthlyCost / constraints.budgetLimit) * 50))
  );

  const performanceScore = Math.max(
    15,
    Math.min(100, Math.round(100 - (option.baseLatencyMs / (constraints.maxLatencyMs * 1.5)) * 50))
  );

  let complianceScore = 75;
  if (option.supportedCompliance.includes('sovereign_airgap')) complianceScore = 100;
  else if (option.supportedCompliance.includes('soc2_hipaa')) complianceScore = 90;

  const timeScore = Math.max(
    10,
    Math.min(100, Math.round(100 - (option.implementationMonths / 18) * 70))
  );

  const contradictionPenalty =
    criticalContradictions.length * 8 +
    (option.contradictions?.filter(c => c.severity === 'moderate').length || 0) * 4;

  const weights = constraints.priorityWeights;
  const totalWeight =
    weights.cost +
    weights.performance +
    weights.compliance +
    weights.timeToValue +
    weights.risk;

  const rawWeightedScore =
    (costScore * weights.cost +
      performanceScore * weights.performance +
      complianceScore * weights.compliance +
      timeScore * weights.timeToValue +
      option.confidenceScore * weights.risk) /
    totalWeight;

  let compositeScore = Math.max(5, Math.round(rawWeightedScore - contradictionPenalty));

  if (isDisqualified) {
    compositeScore = Math.min(48, Math.round(compositeScore * 0.5));
  } else if (isAtRisk) {
    compositeScore = Math.round(compositeScore * 0.9);
  }

  return {
    optionId: option.id,
    isEligible: !isDisqualified,
    status,
    reasons: disqualifications,
    warningReasons: warnings,
    compositeScore,
    costScore,
    performanceScore,
    complianceScore,
    timeScore,
    rank: 0,
  };
}

/**
 * Universal option evaluation dispatcher
 */
export function evaluateOption(
  option: DecisionOption,
  constraints: SimulationConstraints
): OptionSimulationResult {
  if (
    option.domainCategory === 'solar_energy' ||
    option.estimatedCost !== undefined ||
    option.roofSpaceRequired !== undefined ||
    option.dailyEnergyOutput !== undefined
  ) {
    return evaluateSolarOption(option, constraints);
  }

  return evaluateCloudOption(option, constraints);
}

/**
 * Evaluates and sorts all options, ranking eligible options ahead of disqualified/insufficient evidence candidates
 */
export function evaluateAllOptions(
  options: DecisionOption[],
  constraints: SimulationConstraints
): OptionSimulationResult[] {
  const evaluated = options.map(opt => evaluateOption(opt, constraints));

  // Sort: Eligible candidates first by compositeScore descending, followed by disqualified/incomplete
  evaluated.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.compositeScore - a.compositeScore;
  });

  // Assign ranks
  return evaluated.map((res, index) => ({
    ...res,
    rank: index + 1,
  }));
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

export function formatLatency(ms: number): string {
  return `${ms}ms`;
}
