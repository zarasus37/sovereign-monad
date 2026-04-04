import { buildDataRailSnapshot, buildRewardPreview, loadExampleEvents, normalizeBehaviorEvent } from './core';

export { buildDataRailSnapshot, buildRewardPreview, loadExampleEvents, normalizeBehaviorEvent };
export type {
  BehavioralCaptureEvent,
  CaptureActorClass,
  CaptureOutcome,
  CaptureSurface,
  DataRailPolicy,
  DataRailSnapshot,
  NormalizedBehaviorEvent,
  RewardPreview,
} from './types';

function main() {
  const snapshot = buildDataRailSnapshot(loadExampleEvents());
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}
