// hepar/hepar-orchestrator.ts
// Top-level entry point for a complete Hepar assessment run.
// Advisory Tier: fixture-verified only. No live telemetry. No automated capital action.
//
// Sequence:
//   Step 1: Stage A (static forensics)
//   Step 2: Stage B (bounded symbolic proving -- NON-OPTIONAL)
//   Step 3: Stage C (multi-agent Monte Carlo adversarial execution)
//   Step 4: Stage D (consensus confidence fusion)
//   Step 5: Route integrations (all five organs)
//   Step 6: Update registry
//   Step 7: Post attestation (STUB at Advisory tier)
//   Step 8: Open disclosure windows for severity >= 7 findings
//   Step 9: Build OperatorSummary
//   Step 10: Return HeparFullRunOutput

import type { ActionBand, ConvergenceLabel } from './types/hepar.types';
import type { RegistryStatus } from './types/hepar.types';
import type { StageAFinding, StageAResult } from './lib/stages/stageA-static';
import type { StageBResult } from './lib/stages/stageB-symbolic';
import type { StageCResult } from './lib/stages/stageC-montecarlo';
import type { StageDResult, FullHeparRunResult } from './lib/stages/stageD-consensus';
import type { AgentId } from './lib/stages/stageC-utils';
import type { AgentFinding } from './lib/stages/stageC-utils';
import type { EngineAdapter } from './lib/stages/stageB-symbolic';
import type { RegistryEntry } from './lib/registry/registryManager';
import type { AttestationRecord } from './lib/registry/attestation';
import type { DisclosureWindow } from './lib/disclosure/disclosureTimer';
import type { SynapseRoutingResult } from './lib/integration/synapse-router';
import type { CardiaDeliveryResult } from './lib/integration/cardia-caps';
import type { CortexDeliveryResult } from './lib/integration/cortex-escalation';
import type { VoxDeliveryResult } from './lib/integration/vox-packaging';
import type { DataRailWriteResult } from './lib/integration/datarail-record';

import { runStageA } from './lib/stages/stageA-static';
import { runStageB } from './lib/stages/stageB-symbolic';
import { runStageC } from './lib/stages/stageC-montecarlo';
import { runHepar } from './lib/stages/stageD-consensus';

import {
  buildSynapsePayload,
  routeToSynapse
} from './lib/integration/synapse-router';
import {
  buildCardiaAllocationCap,
  sendToCardia
} from './lib/integration/cardia-caps';
import {
  shouldEscalateToCortex,
  buildCortexEscalationPackage,
  sendToCortex
} from './lib/integration/cortex-escalation';
import {
  buildVoxNarrativePackage,
  sendToVox
} from './lib/integration/vox-packaging';
import {
  buildDataRailRecord,
  writeToDataRail
} from './lib/integration/datarail-record';

import {
  createRegistryEntry,
  updateRegistryEntry,
  canPublishExternally
} from './lib/registry/registryManager';
import {
  buildAttestationRecord,
  postAttestation
} from './lib/registry/attestation';

import {
  openDisclosureWindow,
  type DisclosureSeverity
} from './lib/disclosure/disclosureTimer';

// ---------------------------------------------------------------------------
// In-memory registry store (Advisory tier stub)
// Replace with persistent adapter when advancing to Decision-Support tier.
// ---------------------------------------------------------------------------

const _registryStore = new Map<string, RegistryEntry>();

export function _resetRegistryStoreForTesting(): void {
  _registryStore.clear();
}

export function _getRegistryEntry(protocolId: string): RegistryEntry | undefined {
  return _registryStore.get(protocolId);
}

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface IntegrationResults {
  synapse: SynapseRoutingResult;
  cardia: CardiaDeliveryResult;
  /** null when actionBand is not RESTRICTED and cortexReviewFlagged is false */
  cortex: CortexDeliveryResult | null;
  vox: VoxDeliveryResult;
  dataRail: DataRailWriteResult;
}

export interface OperatorSummary {
  actionBand: ActionBand;
  globalScore: number;
  hardBlocked: boolean;
  hardBlockReasons: string[];
  cortexEscalated: boolean;
  topThreeFindings: {
    vectorId: string;
    severity: number;
    convergenceLabel: ConvergenceLabel;
    description: string;
  }[];
  registryStatus: RegistryStatus;
  disclosureWindowsOpened: number;
  /** Always true at Advisory tier -- no automated capital action permitted. */
  requiresOperatorConfirmation: true;
  advisoryTierDisclaimers: string[];
}

export interface HeparFullRunOutput {
  heparRunId: string;
  protocolId: string;
  tierLabel: 'ADVISORY';
  completedAt: number;
  // Four stage outputs
  stageA: StageAResult;
  stageB: StageBResult;
  stageC: StageCResult;
  stageD: StageDResult;
  // Integration results
  integrationResults: IntegrationResults;
  // Registry state after this run
  registryEntry: RegistryEntry;
  // Disclosure windows opened for severity >= HIGH findings
  disclosureWindows: DisclosureWindow[];
  // Attestation record
  attestationRecord: AttestationRecord;
  // Summary for operator review
  operatorSummary: OperatorSummary;
}

export interface HeparOrchestratorInput {
  protocolId: string;
  codeHash: string;
  masterSeed?: string;
  stageAFindings: StageAFinding[];
  /** Injectable Stage B engine for testing or live proving. Defaults to AdvisoryStubEngine. */
  stageBEngine?: EngineAdapter;
  /** Forced findings per agent for Stage C (testing only). */
  stageCForcedFindings?: Partial<Record<AgentId, AgentFinding[]>>;
  /**
   * CAL-006 PC-1: template IDs confirmed absent by live bytecode analysis.
   * Stage D will exclude stub-template findings whose vectorId contains these strings
   * and have requiresLiveBytecodeConfirmation=true. Example: ['PRIV-T03'].
   */
  confirmedAbsentTemplateIds?: string[];
}

// ---------------------------------------------------------------------------
// Advisory tier disclaimer strings
// All three are REQUIRED in every OperatorSummary.
// ---------------------------------------------------------------------------

export const ADVISORY_DISCLAIMERS = [
  'All outputs are fixture-verified only, not live-telemetry-verified.',
  'No automated capital action should be taken without operator confirmation.',
  'This assessment is at Advisory tier. External pricing not permitted.',
] as const;

// ---------------------------------------------------------------------------
// Severity mapping: Stage D severity -> DisclosureSeverity window type
// ---------------------------------------------------------------------------

function toDisclosureSeverity(numericSeverity: number): DisclosureSeverity | null {
  if (numericSeverity >= 8) return 'CRITICAL';
  if (numericSeverity === 7) return 'HIGH';
  return null; // below threshold -- no disclosure window
}

// ---------------------------------------------------------------------------
// runHeparOrchestrator -- full Advisory-tier assessment run
// ---------------------------------------------------------------------------

export function runHeparOrchestrator(input: HeparOrchestratorInput): HeparFullRunOutput {
  const { protocolId, codeHash, masterSeed, stageAFindings } = input;

  // -- Step 1: Stage A (Static Forensics) --
  const stageA = runStageA(stageAFindings);

  // -- Step 2: Stage B (Bounded Symbolic Proving -- NON-OPTIONAL) --
  const stageBOpts: Parameters<typeof runStageB>[0] = {};
  if (input.stageBEngine) stageBOpts.engine = input.stageBEngine;
  const stageB = runStageB(stageBOpts);

  // -- Step 3: Stage C (Multi-Agent Monte Carlo) --
  const stageC = runStageC({
    protocolId,
    masterSeed: masterSeed ?? `HEPAR-${protocolId}`,
    forcedFindings: input.stageCForcedFindings,
  });

  // -- Step 4: Stage D (Consensus Confidence Fusion) --
  const fullResult: FullHeparRunResult = runHepar(
    stageA, stageB, stageC, protocolId, codeHash,
    undefined, // runId — auto-generated
    input.confirmedAbsentTemplateIds,
  );
  const { heparRunId, stageD } = fullResult;

  // -- Step 5: Route integrations (all five organs) --
  const synapsePayload = buildSynapsePayload(fullResult);
  const synapseResult  = routeToSynapse(synapsePayload);

  const cardiaCapResult = sendToCardia(buildCardiaAllocationCap(fullResult));

  let cortexResult: CortexDeliveryResult | null = null;
  if (shouldEscalateToCortex(fullResult)) {
    cortexResult = sendToCortex(buildCortexEscalationPackage(fullResult));
  }

  const voxResult  = sendToVox(buildVoxNarrativePackage(fullResult));
  const railResult = writeToDataRail(buildDataRailRecord(fullResult));

  const integrationResults: IntegrationResults = {
    synapse: synapseResult,
    cardia:  cardiaCapResult,
    cortex:  cortexResult,
    vox:     voxResult,
    dataRail: railResult,
  };

  // -- Step 6: Update registry --
  const existingEntry = _registryStore.get(protocolId);
  let registryEntry: RegistryEntry;
  if (existingEntry) {
    registryEntry = updateRegistryEntry(existingEntry, fullResult);
  } else {
    registryEntry = createRegistryEntry(protocolId, fullResult);
  }
  _registryStore.set(protocolId, registryEntry);

  // -- Step 7: Post attestation (STUB at Advisory tier) --
  const attestationRec = buildAttestationRecord(fullResult);
  const _postResult    = postAttestation(attestationRec);
  const attestationRecord = _postResult.record;

  // -- Step 8: Open disclosure windows for severity >= 7 findings --
  const disclosureWindows: DisclosureWindow[] = [];
  const nowMs = Date.now();
  for (const fv of stageD.findingVectors) {
    const discSeverity = toDisclosureSeverity(fv.severity);
    if (discSeverity !== null) {
      const win = openDisclosureWindow(
        heparRunId,
        protocolId,
        fv.vectorId,
        discSeverity,
        nowMs
      );
      disclosureWindows.push(win);
    }
  }

  // -- Step 9: Build OperatorSummary --
  const cortexEscalated = cortexResult !== null;
  const topThree = [...stageD.scoredVectors]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)
    .map(sv => ({
      vectorId:        sv.vector.vectorId,
      severity:        sv.vector.severity,
      convergenceLabel: sv.vector.convergenceLabel ?? 'EDGE_CASE' as ConvergenceLabel,
      description:     sv.vector.description ?? sv.vector.vectorId,
    }));

  const operatorSummary: OperatorSummary = {
    actionBand:              stageD.actionBand,
    globalScore:             stageD.globalScore,
    hardBlocked:             stageD.actionBand === 'HARDBLOCK',
    hardBlockReasons:        stageD.hardBlockReasons,
    cortexEscalated,
    topThreeFindings:        topThree,
    registryStatus:          registryEntry.currentStatus,
    disclosureWindowsOpened: disclosureWindows.length,
    requiresOperatorConfirmation: true,
    advisoryTierDisclaimers: [...ADVISORY_DISCLAIMERS],
  };

  // -- Step 10: Return HeparFullRunOutput --
  return {
    heparRunId,
    protocolId,
    tierLabel: 'ADVISORY',
    completedAt: Date.now(),
    stageA,
    stageB,
    stageC,
    stageD,
    integrationResults,
    registryEntry,
    disclosureWindows,
    attestationRecord,
    operatorSummary,
  };
}
