/**
 * HEPAR - hepar-orchestrator.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Full pipeline orchestrator: runs all four analytical stages (A, B, C, D)
 * then routes the result to all five downstream organs via the integration layer.
 *
 * Returns FullHeparRunResult extended with IntegrationResults so callers have
 * a single entry point for the complete Hepar pipeline.
 */

import type { StageAFinding } from '../stages/stageA-static';
import type { AdvisoryStubOptions } from '../stages/stageB-symbolic';
import type { FullHeparRunResult } from '../stages/stageD-consensus';
import { runStageA }   from '../stages/stageA-static';
import { runStageB, AdvisoryStubEngine } from '../stages/stageB-symbolic';
import { runStageC }   from '../stages/stageC-montecarlo';
import { runStageD, runHepar as assembleFourStages } from '../stages/stageD-consensus';

import {
  buildSynapsePayload,
  routeToSynapse,
  type SynapseRoutingResult
} from './synapse-router';
import {
  buildCardiaAllocationCap,
  sendToCardia,
  type CardiaDeliveryResult
} from './cardia-caps';
import {
  shouldEscalateToCortex,
  buildCortexEscalationPackage,
  sendToCortex,
  type CortexDeliveryResult
} from './cortex-escalation';
import {
  buildVoxNarrativePackage,
  sendToVox,
  type VoxDeliveryResult
} from './vox-packaging';
import {
  buildDataRailRecord,
  writeToDataRail,
  type DataRailWriteResult
} from './datarail-record';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface HeparInput {
  protocolId:   string;
  codeHash:     string;
  /** Pre-analysed findings for BYTECODE_PRIVILEGE, PROXY_ADMIN, LP_UNLOCK surfaces. */
  stageAFindings: StageAFinding[];
  /** Optional Stage B injection (counterexamples / proved-safe sets for testing). */
  stageBInjections?: {
    knownCounterexamples?: Map<string, string[]>;
    knownProvedSafe?:      Set<string>;
  };
  masterSeed?: string;
  runId?:      string;
}

export interface IntegrationResults {
  synapse:   SynapseRoutingResult;
  cardia:    CardiaDeliveryResult;
  /** null when shouldEscalateToCortex returns false. */
  cortex:    CortexDeliveryResult | null;
  vox:       VoxDeliveryResult;
  dataRail:  DataRailWriteResult;
}

export type OrchestratedHeparResult = FullHeparRunResult & {
  integrationResults: IntegrationResults;
};

// ---------------------------------------------------------------------------
// runHepar (orchestrated)
// ---------------------------------------------------------------------------

export function runHepar(input: HeparInput): OrchestratedHeparResult {
  const {
    protocolId,
    codeHash,
    stageAFindings,
    stageBInjections,
    masterSeed,
    runId
  } = input;

  // Stage A: deterministic static forensics
  const stageAResult = runStageA(stageAFindings);

  // Stage B: bounded symbolic proving
  const stageBOptions: AdvisoryStubOptions = {
    knownCounterexamples: stageBInjections?.knownCounterexamples,
    knownProvedSafe:      stageBInjections?.knownProvedSafe
  };
  const stageBResult = runStageB({ engine: new AdvisoryStubEngine(stageBOptions) });

  // Stage C: multi-agent Monte Carlo
  const stageCResult = runStageC({ masterSeed, protocolId });

  // Stage D: consensus fusion
  const fullResult: FullHeparRunResult = assembleFourStages(
    stageAResult,
    stageBResult,
    stageCResult,
    protocolId,
    codeHash,
    runId
  );

  // Integration layer: route to all five organs
  const synapsePayload = buildSynapsePayload(fullResult);
  const synapse        = routeToSynapse(synapsePayload);

  const cardiaCapMsg   = buildCardiaAllocationCap(fullResult);
  const cardia         = sendToCardia(cardiaCapMsg);

  const cortex: CortexDeliveryResult | null = shouldEscalateToCortex(fullResult)
    ? sendToCortex(buildCortexEscalationPackage(fullResult))
    : null;

  const voxPkg = buildVoxNarrativePackage(fullResult);
  const vox    = sendToVox(voxPkg);

  const drRecord  = buildDataRailRecord(fullResult);
  const dataRail  = writeToDataRail(drRecord);

  return {
    ...fullResult,
    integrationResults: { synapse, cardia, cortex, vox, dataRail }
  };
}
