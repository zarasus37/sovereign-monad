"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildParticipationSnapshot = buildParticipationSnapshot;
function decideActor(actor) {
    const blockedReasons = [];
    let allowedSurface = 'read_only';
    if (actor.mode === 'ecosystem_native') {
        allowedSurface = 'ecosystem_native_runtime';
    }
    if (actor.mode === 'delegated_human') {
        if (!actor.hasDelegateAgent) {
            blockedReasons.push('delegated human participation requires a delegate agent');
        }
        else {
            allowedSurface = 'delegated_agent_surface';
        }
    }
    if (actor.mode === 'operator_override') {
        allowedSurface = 'operator_review_surface';
        if (actor.canOverrideBoundaries) {
            blockedReasons.push('operator override cannot bypass boundary rules by default');
        }
    }
    if (actor.canTouchCapital && actor.mode !== 'ecosystem_native') {
        blockedReasons.push('capital-touching actions are reserved for ecosystem-native or explicitly governed flows');
    }
    return {
        actorId: actor.id,
        allowedSurface,
        blockedReasons,
    };
}
function buildParticipationSnapshot(actors) {
    return {
        implemented: true,
        actorCount: actors.length,
        decisions: actors.map(decideActor),
    };
}
