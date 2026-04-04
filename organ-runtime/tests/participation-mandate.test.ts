import { buildFirstMandateSnapshot } from '../src/mandate';
import { buildParticipationSnapshot } from '../src/participation';

describe('buildParticipationSnapshot', () => {
  it('keeps operator override inside boundary review and blocks direct capital touch for delegated humans', () => {
    const snapshot = buildParticipationSnapshot([
      {
        id: 'native-synapse',
        mode: 'ecosystem_native',
        hasDelegateAgent: false,
        canTouchCapital: false,
        canOverrideBoundaries: false,
        summary: 'native organ',
      },
      {
        id: 'delegated-human',
        mode: 'delegated_human',
        hasDelegateAgent: true,
        canTouchCapital: true,
        canOverrideBoundaries: false,
        summary: 'delegated actor',
      },
      {
        id: 'operator-review',
        mode: 'operator_override',
        hasDelegateAgent: false,
        canTouchCapital: false,
        canOverrideBoundaries: true,
        summary: 'operator',
      },
    ]);

    expect(snapshot.actorCount).toBe(3);
    expect(snapshot.decisions).toEqual([
      {
        actorId: 'native-synapse',
        allowedSurface: 'ecosystem_native_runtime',
        blockedReasons: [],
      },
      {
        actorId: 'delegated-human',
        allowedSurface: 'delegated_agent_surface',
        blockedReasons: [
          'capital-touching actions are reserved for ecosystem-native or explicitly governed flows',
        ],
      },
      {
        actorId: 'operator-review',
        allowedSurface: 'operator_review_surface',
        blockedReasons: ['operator override cannot bypass boundary rules by default'],
      },
    ]);
  });
});

describe('buildFirstMandateSnapshot', () => {
  it('constructs the bounded internal loop and surfaces open gate checks', () => {
    const snapshot = buildFirstMandateSnapshot({
      title: 'Bounded research-to-exchange internal loop',
      synapse: {
        implemented: true,
        sampleSignalCount: 1,
        routeDecisions: [],
      },
      hepar: {
        implemented: true,
        screenedCount: 2,
        approvedCount: 1,
        decisions: [],
      },
      cortex: {
        implemented: true,
        sourceCount: 1,
        briefs: [],
      },
      vox: {
        implemented: true,
        requestCount: 1,
        packages: [],
      },
      pneuma: {
        implemented: true,
        leadCount: 2,
        acceptedCount: 1,
        decisions: [],
      },
      cardia: {
        implemented: true,
        reserveHealthy: true,
        deploymentMode: 'analysis_only',
        decisions: [],
      },
      immune: {
        implemented: true,
        incidentCount: 1,
        barrierTriggerCount: 1,
        repairQueueCount: 0,
        decisions: [],
      },
      participation: {
        implemented: true,
        actorCount: 1,
        decisions: [
          {
            actorId: 'operator-review',
            allowedSurface: 'operator_review_surface',
            blockedReasons: ['operator override cannot bypass boundary rules by default'],
          },
        ],
      },
    });

    expect(snapshot.status).toBe('analysis_ready');
    expect(snapshot.sequence).toContain(
      'Cardia remains analysis_only until capital is live',
    );
    expect(snapshot.gateChecks).toContain(
      'Immune layer has active barrier triggers requiring review',
    );
    expect(snapshot.gateChecks).toContain(
      'Participation boundary review is required before human-linked surfaces advance',
    );
  });
});
