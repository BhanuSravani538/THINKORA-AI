import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const evaluateConstraintsSchema = z.object({
  budgetLimit: z.number().positive(),
  maxLatencyMs: z.number().positive(),
  maxSpaceUnits: z.number().nonnegative(),
  requiredCompliance: z.enum(['standard', 'soc2_hipaa', 'sovereign_airgap']),
  maxImplementationMonths: z.number().positive(),
  maxComplexity: z.enum(['low', 'medium', 'high']).default('medium'),
  priorityWeights: z
    .object({
      cost: z.number().min(1).max(5).default(4),
      performance: z.number().min(1).max(5).default(5),
      compliance: z.number().min(1).max(5).default(5),
      timeToValue: z.number().min(1).max(5).default(3),
      risk: z.number().min(1).max(5).default(4),
    })
    .default({
      cost: 4,
      performance: 5,
      compliance: 5,
      timeToValue: 3,
      risk: 4,
    }),
});

// Standard candidate architectures for evaluation
const CANDIDATE_OPTIONS = [
  {
    id: 'opt-serverless',
    name: 'Multi-Region Serverless (Cloud-Native AWS/GCP)',
    badge: 'Fastest Delivery',
    baseMonthlyCost: 172000,
    baseLatencyMs: 38,
    spaceRequiredUnits: 0,
    supportedCompliance: ['standard', 'soc2_hipaa'],
    implementationMonths: 4,
    complexityLevel: 'low',
    confidenceScore: 81,
    criticalContradictions: 1,
  },
  {
    id: 'opt-hybrid-k8s',
    name: 'Hybrid Kubernetes Fabric (EKS Anywhere + Equinix Metal)',
    badge: 'Recommended Winner',
    baseMonthlyCost: 98500,
    baseLatencyMs: 14,
    spaceRequiredUnits: 6,
    supportedCompliance: ['standard', 'soc2_hipaa'],
    implementationMonths: 7,
    complexityLevel: 'medium',
    confidenceScore: 94,
    criticalContradictions: 0,
  },
  {
    id: 'opt-openstack',
    name: 'Private Sovereign Colocation (OpenStack + Ceph SAN)',
    badge: 'Maximum Sovereignty',
    baseMonthlyCost: 142000,
    baseLatencyMs: 9,
    spaceRequiredUnits: 18,
    supportedCompliance: ['standard', 'soc2_hipaa', 'sovereign_airgap'],
    implementationMonths: 14,
    complexityLevel: 'high',
    confidenceScore: 87,
    criticalContradictions: 1,
  },
];

// Optional auth for evaluate endpoint (public or authenticated)
router.post(
  '/evaluate',
  validateBody(evaluateConstraintsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const constraints = req.body;

      const results = CANDIDATE_OPTIONS.map(opt => {
        const violations: string[] = [];
        const warnings: string[] = [];

        // 1. Budget constraint
        if (opt.baseMonthlyCost > constraints.budgetLimit) {
          violations.push(
            `Budget overrun: $${(opt.baseMonthlyCost / 1000).toFixed(1)}k exceeds limit of $${(constraints.budgetLimit / 1000).toFixed(1)}k`
          );
        } else if (opt.baseMonthlyCost > constraints.budgetLimit * 0.88) {
          warnings.push(`Utilizes ${( (opt.baseMonthlyCost / constraints.budgetLimit) * 100 ).toFixed(0)}% of budget ceiling`);
        }

        // 2. Latency constraint
        if (opt.baseLatencyMs > constraints.maxLatencyMs) {
          violations.push(
            `Latency breach: ${opt.baseLatencyMs}ms exceeds SLA limit of ${constraints.maxLatencyMs}ms`
          );
        }

        // 3. Space constraint
        if (opt.spaceRequiredUnits > constraints.maxSpaceUnits) {
          violations.push(
            `Space violation: Requires ${opt.spaceRequiredUnits} racks, exceeding limit of ${constraints.maxSpaceUnits} racks`
          );
        }

        // 4. Compliance constraint
        if (constraints.requiredCompliance === 'sovereign_airgap' && !opt.supportedCompliance.includes('sovereign_airgap')) {
          violations.push('Compliance failure: Does not support Sovereign Air-Gap isolation');
        } else if (constraints.requiredCompliance === 'soc2_hipaa' && !opt.supportedCompliance.includes('soc2_hipaa') && !opt.supportedCompliance.includes('sovereign_airgap')) {
          violations.push('Compliance failure: Missing SOC2/HIPAA attestation');
        }

        // 5. Timeline constraint
        if (opt.implementationMonths > constraints.maxImplementationMonths) {
          violations.push(`Deployment timeline of ${opt.implementationMonths} mo exceeds deadline of ${constraints.maxImplementationMonths} mo`);
        }

        const isDisqualified = violations.length > 0;
        const isAtRisk = !isDisqualified && warnings.length > 0;

        // Subscores 0-100
        const costScore = Math.max(10, Math.min(100, Math.round(100 - (opt.baseMonthlyCost / constraints.budgetLimit) * 50)));
        const performanceScore = Math.max(15, Math.min(100, Math.round(100 - (opt.baseLatencyMs / (constraints.maxLatencyMs * 1.5)) * 50)));
        const complianceScore = opt.supportedCompliance.includes('sovereign_airgap') ? 100 : 90;
        const timeScore = Math.max(10, Math.min(100, Math.round(100 - (opt.implementationMonths / 18) * 70)));

        const weights = constraints.priorityWeights;
        const totalWeight = weights.cost + weights.performance + weights.compliance + weights.timeToValue + weights.risk;

        const weightedScore =
          (costScore * weights.cost +
            performanceScore * weights.performance +
            complianceScore * weights.compliance +
            timeScore * weights.timeToValue +
            opt.confidenceScore * weights.risk) /
          totalWeight;

        let compositeScore = Math.round(weightedScore - opt.criticalContradictions * 8);

        if (isDisqualified) compositeScore = Math.min(48, Math.round(compositeScore * 0.5));
        else if (isAtRisk) compositeScore = Math.round(compositeScore * 0.9);

        return {
          optionId: opt.id,
          name: opt.name,
          badge: opt.badge,
          isEligible: !isDisqualified,
          status: isDisqualified ? 'disqualified' : isAtRisk ? 'at_risk' : 'eligible',
          compositeScore,
          costScore,
          performanceScore,
          complianceScore,
          timeScore,
          violations,
          warnings,
        };
      });

      // Sort by score descending and assign rank
      results.sort((a, b) => b.compositeScore - a.compositeScore);
      const rankedResults = results.map((r, idx) => ({ ...r, rank: idx + 1 }));

      res.status(200).json({
        success: true,
        evaluatedOptionsCount: rankedResults.length,
        eligibleCount: rankedResults.filter(r => r.isEligible).length,
        data: rankedResults,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
