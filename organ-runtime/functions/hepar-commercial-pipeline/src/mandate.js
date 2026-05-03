"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFirstMandateSnapshot = buildFirstMandateSnapshot;
function buildFirstMandateSnapshot(input) {
    const gateChecks = [];
    if (input.synapse.sampleSignalCount === 0)
        gateChecks.push('Synapse needs at least one signal');
    if (input.hepar.approvedCount === 0)
        gateChecks.push('Hepar needs at least one bounded approved opportunity');
    if (input.cortex.sourceCount === 0)
        gateChecks.push('Cortex needs research input');
    if (input.vox.requestCount === 0)
        gateChecks.push('Vox needs at least one narrative request');
    if (input.pneuma.acceptedCount === 0)
        gateChecks.push('Pneuma needs at least one accepted exchange candidate');
    if (input.immune.barrierTriggerCount > 0)
        gateChecks.push('Immune layer has active barrier triggers requiring review');
    if (input.participation.decisions.some((d) => d.blockedReasons.length > 0)) {
        gateChecks.push('Participation boundary review is required before human-linked surfaces advance');
    }
    const sequence = [
        'Synapse routes the initiating signal',
        'Hepar filters the candidate opportunity or path',
        'Cortex synthesizes the actionable brief',
        'Vox packages the brief for the target surface',
        'Pneuma qualifies the outbound exchange path',
        `Cardia remains ${input.cardia.deploymentMode} until capital is live`,
    ];
    return {
        implemented: true,
        title: input.title,
        status: 'analysis_ready',
        sequence,
        gateChecks,
    };
}
