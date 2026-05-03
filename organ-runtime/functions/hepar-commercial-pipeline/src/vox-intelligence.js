"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVoxNarrativeIntelligenceSnapshot = buildVoxNarrativeIntelligenceSnapshot;
function truthStatus(input) {
    if (input.contradictionCount > 0)
        return 'conflicted';
    if (input.facts.length > 0 && input.proofRefs.length > 0)
        return 'verified';
    if (input.facts.length > 0)
        return 'incomplete';
    return 'conflicted';
}
function channelFor(audience) {
    switch (audience) {
        case 'operators':
            return 'dao-ops-forum';
        case 'buyers':
            return 'institutional-brief';
        case 'partners':
            return 'partner-briefing';
        case 'public':
            return 'social-thread';
    }
}
function summaryForAudience(input, audience) {
    const lead = input.facts[0] || input.eventTitle;
    switch (audience) {
        case 'operators':
            return `Operational truth: ${lead}. Decision timeline and gating evidence attached.`;
        case 'buyers':
            return `Institutional risk update: ${lead}. Methodology and reproducibility notes included.`;
        case 'partners':
            return `Coordination update: ${lead}. Includes execution impact and collaboration requirements.`;
        case 'public':
            return `Plain-language summary: ${lead}. Supporting evidence published for transparency.`;
    }
}
function buildAudiencePackages(input) {
    const status = truthStatus(input);
    const warnings = [];
    if (status === 'incomplete')
        warnings.push('evidence references are missing for one or more claims');
    if (status === 'conflicted')
        warnings.push('narrative contains unresolved contradictions');
    return input.audiences.map((audience) => ({
        audience,
        channel: channelFor(audience),
        summary: summaryForAudience(input, audience),
        truthStatus: status,
        coherenceWarnings: warnings,
        proofRefs: input.proofRefs,
    }));
}
function buildVoxNarrativeIntelligenceSnapshot(inputs) {
    const packages = inputs.flatMap((input) => buildAudiencePackages(input));
    const verifiedCount = packages.filter((item) => item.truthStatus === 'verified').length;
    const conflictedCount = packages.filter((item) => item.truthStatus === 'conflicted').length;
    return {
        implemented: true,
        inputCount: inputs.length,
        packageCount: packages.length,
        verifiedCount,
        conflictedCount,
        packages,
    };
}
