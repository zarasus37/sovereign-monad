/**
 * HEPAR - vox-packaging.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Packages evidence-linked, confidence-rated narrative output for Vox organ.
 *
 * Key rules (NON-NEGOTIABLE):
 *   - No speculation. No embellishment.
 *   - Every claim must trace back to a finding vector with a vectorId.
 *   - Vox only packages findings that are Advisory-tier-cleared.
 *   - Advisory tier disclaimer ALWAYS included in every audience package.
 *
 * truthStatus logic:
 *   VERIFIED    — all top vectors CERTAIN or HIGH, proofterm > 0 (not proved-safe)
 *   INCOMPLETE  — any top vector POSSIBLE or EDGE_CASE, OR walletTaint PIPELINE_REQUIRED
 *   CONFLICTED  — Stage B proved-safe on a surface where Stage C found a high-sev finding
 *
 * Transport: INTEGRATION_STUB at Advisory tier.
 */

import type {
  ActionBand,
  FindingVector,
  ConvergenceLabel,
  SymbolicResult
} from '../../types/hepar.types';
import type { FullHeparRunResult } from '../stages/stageD-consensus';

// ---------------------------------------------------------------------------
// VoxFinding
// ---------------------------------------------------------------------------

export interface VoxFinding {
  vectorId:      string;
  description:   string;        // factual, no embellishment
  severity:      number;
  convergenceLabel: ConvergenceLabel;
  proofStatus:   SymbolicResult | 'NOT_CHECKED';
  evidenceBasis: string;        // what specific evidence backs this finding
}

// ---------------------------------------------------------------------------
// VoxAudiencePackage
// ---------------------------------------------------------------------------

export interface VoxAudiencePackage {
  audience:       'INTERNAL' | 'INSTITUTIONAL';
  summary:        string;             // 2-3 sentence non-speculative summary
  keyFindings:    VoxFinding[];
  actionBand:     ActionBand;
  evidenceLinks:  string[];           // vectorIds that back every claim
  proofReferences: string[];          // symbolic proof statuses from Stage B
  disclaimers:    string[];           // Advisory tier disclaimers always included
}

// ---------------------------------------------------------------------------
// VoxNarrativePackage
// ---------------------------------------------------------------------------

export type VoxTruthStatus = 'VERIFIED' | 'INCOMPLETE' | 'CONFLICTED';

export interface VoxNarrativePackage {
  heparRunId:        string;
  protocolId:        string;
  audiencePackages: {
    internal:        VoxAudiencePackage;
    institutional:   VoxAudiencePackage;
  };
  truthStatus:       VoxTruthStatus;
  coherenceWarnings: string[];        // populated if any finding has low confidence
  tierLabel:         'ADVISORY';
  timestamp:         number;
}

export interface VoxDeliveryResult {
  delivered:       boolean;
  transportStatus: 'STUB' | 'LIVE';
  package:         VoxNarrativePackage;
  sentAt:          number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADVISORY_DISCLAIMER =
  'This assessment is at Advisory tier. Outputs are fixture-verified, ' +
  'not live-telemetry-verified. No external pricing or automated capital ' +
  'action should be taken on this output without operator confirmation.';

const LOW_CONFIDENCE_LABELS = new Set<ConvergenceLabel>(['POSSIBLE', 'EDGE_CASE']);
const HIGH_SEVERITY_THRESHOLD = 7;

// ---------------------------------------------------------------------------
// truthStatus derivation
// ---------------------------------------------------------------------------

function deriveTruthStatus(
  topVectors: FindingVector[],
  walletTaintProvisional: boolean
): VoxTruthStatus {
  // CONFLICTED check first: proved-safe on a surface where Stage C found high-sev
  const hasConflict = topVectors.some(
    v => v.proofStatus === 'proved-safe' && v.severity >= HIGH_SEVERITY_THRESHOLD
  );
  if (hasConflict) return 'CONFLICTED';

  // INCOMPLETE check: any low-confidence label OR wallet taint not assessed
  const hasLowConfidence = topVectors.some(
    v => LOW_CONFIDENCE_LABELS.has(v.convergenceLabel ?? 'EDGE_CASE')
  );
  if (hasLowConfidence || walletTaintProvisional) return 'INCOMPLETE';

  // VERIFIED: all top vectors are CERTAIN or HIGH with proofterm > 0
  // (proofterm > 0 means not proved-safe — proved-safe is 0)
  const allHighConfidence = topVectors.every(v => {
    const label = v.convergenceLabel ?? 'EDGE_CASE';
    return label === 'CERTAIN' || label === 'HIGH';
  });
  const allProoftermPositive = topVectors.every(v => v.proofStatus !== 'proved-safe');

  if (allHighConfidence && allProoftermPositive && topVectors.length > 0) {
    return 'VERIFIED';
  }

  // Default: incomplete (no top vectors, or mixed confidence without conflict)
  return 'INCOMPLETE';
}

// ---------------------------------------------------------------------------
// VoxFinding construction
// ---------------------------------------------------------------------------

function vectorToVoxFinding(v: FindingVector): VoxFinding {
  // Map unknown/timeout to NOT_CHECKED for Vox output clarity
  const proofStatus: SymbolicResult | 'NOT_CHECKED' =
    v.proofStatus === 'unknown/timeout' ? 'NOT_CHECKED' : v.proofStatus;

  const convergenceLabel: ConvergenceLabel = v.convergenceLabel ?? 'EDGE_CASE';

  // evidenceBasis: factual statement based on convergence and proof status
  let evidenceBasis =
    `Found by ${v.agentsFound}/${v.totalAgents} agents (${convergenceLabel}).`;
  if (v.proofStatus === 'counterexample-found') {
    evidenceBasis += ' Symbolic counterexample confirmed.';
  } else if (v.proofStatus === 'proved-safe') {
    evidenceBasis += ' Symbolic prover found this surface safe.';
  }

  return {
    vectorId:      v.vectorId,
    description:   v.description ?? `Finding vector ${v.vectorId}`,
    severity:      v.severity,
    convergenceLabel,
    proofStatus,
    evidenceBasis
  };
}

// ---------------------------------------------------------------------------
// Audience package construction
// ---------------------------------------------------------------------------

function buildAudiencePackage(
  audience: 'INTERNAL' | 'INSTITUTIONAL',
  topVectors: FindingVector[],
  allVectors: FindingVector[],
  actionBand: ActionBand,
  truthStatus: VoxTruthStatus,
  stageBProofRefs: string[]
): VoxAudiencePackage {
  const keyFindings = topVectors.map(vectorToVoxFinding);
  const evidenceLinks = topVectors.map(v => v.vectorId);

  // Build non-speculative summary
  const vectorCount = allVectors.length;
  const criticalCount = allVectors.filter(v => v.severity >= 9).length;
  const highCount = allVectors.filter(v => v.severity >= 7 && v.severity < 9).length;

  let summary: string;
  if (audience === 'INTERNAL') {
    summary =
      `Hepar Advisory assessment completed: action band ${actionBand}, ` +
      `${vectorCount} finding vector(s) identified ` +
      `(${criticalCount} CRITICAL, ${highCount} HIGH). ` +
      `Truth status: ${truthStatus}. ` +
      `All outputs are fixture-verified at Advisory tier; operator confirmation required.`;
  } else {
    // Institutional: non-speculative, no internal detail
    summary =
      `Protocol risk assessment completed at Advisory tier. ` +
      `Risk classification: ${actionBand}. ` +
      `${vectorCount > 0 ? `${vectorCount} risk vector(s) identified.` : 'No material risk vectors identified.'} ` +
      `Operator confirmation required before any capital action.`;
  }

  const disclaimers = [ADVISORY_DISCLAIMER];
  if (truthStatus === 'INCOMPLETE') {
    disclaimers.push(
      'Assessment is INCOMPLETE: one or more findings have low confidence ' +
      'or wallet taint analysis requires a dedicated chain analytics pipeline.'
    );
  }
  if (truthStatus === 'CONFLICTED') {
    disclaimers.push(
      'Assessment contains CONFLICTED signals: symbolic prover marked a surface safe ' +
      'while adversarial execution found a high-severity finding on the same surface.'
    );
  }

  return {
    audience,
    summary,
    keyFindings,
    actionBand,
    evidenceLinks,
    proofReferences: stageBProofRefs,
    disclaimers
  };
}

// ---------------------------------------------------------------------------
// buildVoxNarrativePackage
// ---------------------------------------------------------------------------

export function buildVoxNarrativePackage(result: FullHeparRunResult): VoxNarrativePackage {
  const { stageD, stageB, heparRunId, protocolId } = result;

  // Top 5 vectors by risk score, descending
  const topVectors: FindingVector[] = [...stageD.scoredVectors]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map(sv => sv.vector);

  const truthStatus = deriveTruthStatus(topVectors, stageD.walletTaintProvisional);

  // Coherence warnings for low-confidence findings
  const coherenceWarnings: string[] = [];
  for (const v of stageD.findingVectors) {
    const label = v.convergenceLabel ?? 'EDGE_CASE';
    if (LOW_CONFIDENCE_LABELS.has(label)) {
      coherenceWarnings.push(
        `Vector ${v.vectorId} has low confidence (${label}); ` +
        `treat finding as indicative only.`
      );
    }
  }

  // Stage B proof status references
  const { provedSafe, counterexamplesFound, unknownTimeout, totalChecked } = stageB.summary;
  const stageBProofRefs = [
    `Stage B symbolic checks: ${totalChecked} invariants checked. ` +
    `proved-safe=${provedSafe}, counterexample-found=${counterexamplesFound}, ` +
    `unknown/timeout=${unknownTimeout}.`
  ];

  return {
    heparRunId,
    protocolId,
    audiencePackages: {
      internal: buildAudiencePackage(
        'INTERNAL', topVectors, stageD.findingVectors,
        stageD.actionBand, truthStatus, stageBProofRefs
      ),
      institutional: buildAudiencePackage(
        'INSTITUTIONAL', topVectors, stageD.findingVectors,
        stageD.actionBand, truthStatus, stageBProofRefs
      )
    },
    truthStatus,
    coherenceWarnings,
    tierLabel: 'ADVISORY',
    timestamp: Date.now()
  };
}

// ---------------------------------------------------------------------------
// sendToVox — Advisory tier stub transport
// ---------------------------------------------------------------------------

export function sendToVox(pkg: VoxNarrativePackage): VoxDeliveryResult {
  // INTEGRATION_STUB: no live Vox runtime connected at Advisory tier.
  // Replace this adapter with the live narrative routing transport when ready.
  return {
    delivered:       true,
    transportStatus: 'STUB',
    package:         pkg,
    sentAt:          Date.now()
  };
}
