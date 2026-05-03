"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHeparSnapshot = exports.screenOpportunity = void 0;
function penaltyForRisk(risk) {
    switch (risk) {
        case 'low':
            return 0;
        case 'medium':
            return 15;
        case 'high':
            return 35;
    }
}
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function clamp100(value) {
    return Math.max(0, Math.min(100, value));
}
function normalize(value, max) {
    if (!Number.isFinite(value) || max <= 0)
        return 0;
    return clamp01(value / max);
}
function defaultForensics(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45;
    return {
        bytecode: {
            uncheckedOwnerDrainFunctions: (_b = (_a = input === null || input === void 0 ? void 0 : input.bytecode) === null || _a === void 0 ? void 0 : _a.uncheckedOwnerDrainFunctions) !== null && _b !== void 0 ? _b : 0,
            hiddenPauseMechanisms: (_d = (_c = input === null || input === void 0 ? void 0 : input.bytecode) === null || _c === void 0 ? void 0 : _c.hiddenPauseMechanisms) !== null && _d !== void 0 ? _d : false,
            selfdestructReachable: (_f = (_e = input === null || input === void 0 ? void 0 : input.bytecode) === null || _e === void 0 ? void 0 : _e.selfdestructReachable) !== null && _f !== void 0 ? _f : false,
            uninitializedProxyImplementation: (_h = (_g = input === null || input === void 0 ? void 0 : input.bytecode) === null || _g === void 0 ? void 0 : _g.uninitializedProxyImplementation) !== null && _h !== void 0 ? _h : false,
            ownerAddressCount: (_k = (_j = input === null || input === void 0 ? void 0 : input.bytecode) === null || _j === void 0 ? void 0 : _j.ownerAddressCount) !== null && _k !== void 0 ? _k : 3,
            ownerConcentrationScore: (_m = (_l = input === null || input === void 0 ? void 0 : input.bytecode) === null || _l === void 0 ? void 0 : _l.ownerConcentrationScore) !== null && _m !== void 0 ? _m : 25,
        },
        proxyAdmin: {
            proxyAdminPresent: (_p = (_o = input === null || input === void 0 ? void 0 : input.proxyAdmin) === null || _o === void 0 ? void 0 : _o.proxyAdminPresent) !== null && _p !== void 0 ? _p : true,
            upgradeAuthorityAddressCount: (_r = (_q = input === null || input === void 0 ? void 0 : input.proxyAdmin) === null || _q === void 0 ? void 0 : _q.upgradeAuthorityAddressCount) !== null && _r !== void 0 ? _r : 3,
            upgradeDelayHours: (_t = (_s = input === null || input === void 0 ? void 0 : input.proxyAdmin) === null || _s === void 0 ? void 0 : _s.upgradeDelayHours) !== null && _t !== void 0 ? _t : 48,
            proxyPattern: (_v = (_u = input === null || input === void 0 ? void 0 : input.proxyAdmin) === null || _u === void 0 ? void 0 : _u.proxyPattern) !== null && _v !== void 0 ? _v : 'transparent',
            beaconChainDepth: (_x = (_w = input === null || input === void 0 ? void 0 : input.proxyAdmin) === null || _w === void 0 ? void 0 : _w.beaconChainDepth) !== null && _x !== void 0 ? _x : 0,
            timelockBypassVector: (_z = (_y = input === null || input === void 0 ? void 0 : input.proxyAdmin) === null || _y === void 0 ? void 0 : _y.timelockBypassVector) !== null && _z !== void 0 ? _z : false,
        },
        lpUnlock: {
            lpTopHolderConcentrationPct: (_1 = (_0 = input === null || input === void 0 ? void 0 : input.lpUnlock) === null || _0 === void 0 ? void 0 : _0.lpTopHolderConcentrationPct) !== null && _1 !== void 0 ? _1 : 35,
            daysToMajorUnlock: (_3 = (_2 = input === null || input === void 0 ? void 0 : input.lpUnlock) === null || _2 === void 0 ? void 0 : _2.daysToMajorUnlock) !== null && _3 !== void 0 ? _3 : 180,
            majorUnlockPercent: (_5 = (_4 = input === null || input === void 0 ? void 0 : input.lpUnlock) === null || _4 === void 0 ? void 0 : _4.majorUnlockPercent) !== null && _5 !== void 0 ? _5 : 20,
            historicalUnlockViolations: (_7 = (_6 = input === null || input === void 0 ? void 0 : input.lpUnlock) === null || _6 === void 0 ? void 0 : _6.historicalUnlockViolations) !== null && _7 !== void 0 ? _7 : 0,
            lpLockerVerified: (_9 = (_8 = input === null || input === void 0 ? void 0 : input.lpUnlock) === null || _8 === void 0 ? void 0 : _8.lpLockerVerified) !== null && _9 !== void 0 ? _9 : true,
        },
        walletTaint: {
            taintedFundingLinks: (_11 = (_10 = input === null || input === void 0 ? void 0 : input.walletTaint) === null || _10 === void 0 ? void 0 : _10.taintedFundingLinks) !== null && _11 !== void 0 ? _11 : 0,
            knownRugLaunchCount: (_13 = (_12 = input === null || input === void 0 ? void 0 : input.walletTaint) === null || _12 === void 0 ? void 0 : _12.knownRugLaunchCount) !== null && _13 !== void 0 ? _13 : 0,
            ponziAssociationCount: (_15 = (_14 = input === null || input === void 0 ? void 0 : input.walletTaint) === null || _14 === void 0 ? void 0 : _14.ponziAssociationCount) !== null && _15 !== void 0 ? _15 : 0,
            suddenProtocolExposureCount: (_17 = (_16 = input === null || input === void 0 ? void 0 : input.walletTaint) === null || _16 === void 0 ? void 0 : _16.suddenProtocolExposureCount) !== null && _17 !== void 0 ? _17 : 0,
            coordinatedPatternScore: (_19 = (_18 = input === null || input === void 0 ? void 0 : input.walletTaint) === null || _18 === void 0 ? void 0 : _18.coordinatedPatternScore) !== null && _19 !== void 0 ? _19 : 10,
        },
        adversarial: {
            maxIntPathVulnerabilities: (_21 = (_20 = input === null || input === void 0 ? void 0 : input.adversarial) === null || _20 === void 0 ? void 0 : _20.maxIntPathVulnerabilities) !== null && _21 !== void 0 ? _21 : 0,
            flashloanInvariantBreaks: (_23 = (_22 = input === null || input === void 0 ? void 0 : input.adversarial) === null || _22 === void 0 ? void 0 : _22.flashloanInvariantBreaks) !== null && _23 !== void 0 ? _23 : 0,
            unexpectedCallOrderBreaks: (_25 = (_24 = input === null || input === void 0 ? void 0 : input.adversarial) === null || _24 === void 0 ? void 0 : _24.unexpectedCallOrderBreaks) !== null && _25 !== void 0 ? _25 : 0,
            soleLpWithdrawalExploit: (_27 = (_26 = input === null || input === void 0 ? void 0 : input.adversarial) === null || _26 === void 0 ? void 0 : _26.soleLpWithdrawalExploit) !== null && _27 !== void 0 ? _27 : false,
            economicInvariantViolations: (_29 = (_28 = input === null || input === void 0 ? void 0 : input.adversarial) === null || _28 === void 0 ? void 0 : _28.economicInvariantViolations) !== null && _29 !== void 0 ? _29 : 0,
            estimatedExploitableLossUsd: (_31 = (_30 = input === null || input === void 0 ? void 0 : input.adversarial) === null || _30 === void 0 ? void 0 : _30.estimatedExploitableLossUsd) !== null && _31 !== void 0 ? _31 : 0,
        },
        honeypotProbability: (_32 = input === null || input === void 0 ? void 0 : input.honeypotProbability) !== null && _32 !== void 0 ? _32 : 0,
        criticalAuditFindings: (_33 = input === null || input === void 0 ? void 0 : input.criticalAuditFindings) !== null && _33 !== void 0 ? _33 : 0,
        unresolvedIncidents30d: (_34 = input === null || input === void 0 ? void 0 : input.unresolvedIncidents30d) !== null && _34 !== void 0 ? _34 : 0,
        top10HolderConcentrationPct: (_35 = input === null || input === void 0 ? void 0 : input.top10HolderConcentrationPct) !== null && _35 !== void 0 ? _35 : 35,
        liquidityLockDays: (_36 = input === null || input === void 0 ? void 0 : input.liquidityLockDays) !== null && _36 !== void 0 ? _36 : 30,
        liquidityLockPercent: (_37 = input === null || input === void 0 ? void 0 : input.liquidityLockPercent) !== null && _37 !== void 0 ? _37 : 80,
        adminKeyModel: (_38 = input === null || input === void 0 ? void 0 : input.adminKeyModel) !== null && _38 !== void 0 ? _38 : 'multisig_timelocked',
        upgradeability: (_39 = input === null || input === void 0 ? void 0 : input.upgradeability) !== null && _39 !== void 0 ? _39 : 'timelocked',
        privilegedFunctionCount: (_40 = input === null || input === void 0 ? void 0 : input.privilegedFunctionCount) !== null && _40 !== void 0 ? _40 : 2,
        oracleDiversityScore: (_41 = input === null || input === void 0 ? void 0 : input.oracleDiversityScore) !== null && _41 !== void 0 ? _41 : 70,
        washTradingScore: (_42 = input === null || input === void 0 ? void 0 : input.washTradingScore) !== null && _42 !== void 0 ? _42 : 20,
        dependencyRiskScore: (_43 = input === null || input === void 0 ? void 0 : input.dependencyRiskScore) !== null && _43 !== void 0 ? _43 : 20,
        counterpartyReputationScore: (_44 = input === null || input === void 0 ? void 0 : input.counterpartyReputationScore) !== null && _44 !== void 0 ? _44 : 70,
        contractAgeDays: (_45 = input === null || input === void 0 ? void 0 : input.contractAgeDays) !== null && _45 !== void 0 ? _45 : 180,
    };
}
function adminKeyRisk(model) {
    switch (model) {
        case 'renounced':
            return 0;
        case 'multisig_timelocked':
            return 20;
        case 'multisig':
            return 55;
        case 'single_key':
            return 85;
    }
}
function upgradeabilityRisk(model) {
    switch (model) {
        case 'immutable':
            return 0;
        case 'timelocked':
            return 20;
        case 'unbounded':
            return 80;
    }
}
function bytecodeRisk(f) {
    return clamp100((normalize(f.bytecode.uncheckedOwnerDrainFunctions, 4) * 100 * 0.30) +
        ((f.bytecode.hiddenPauseMechanisms ? 1 : 0) * 100 * 0.15) +
        ((f.bytecode.selfdestructReachable ? 1 : 0) * 100 * 0.20) +
        ((f.bytecode.uninitializedProxyImplementation ? 1 : 0) * 100 * 0.20) +
        (normalize(f.bytecode.ownerConcentrationScore, 100) * 100 * 0.15));
}
function proxyControlRisk(f) {
    const proxyPatternRisk = f.proxyAdmin.proxyPattern === 'beacon'
        ? 65
        : f.proxyAdmin.proxyPattern === 'uups'
            ? 45
            : f.proxyAdmin.proxyPattern === 'transparent'
                ? 35
                : 0;
    return clamp100(((f.proxyAdmin.proxyAdminPresent ? 1 : 0) * 100 * 0.10) +
        (normalize(Math.max(0, 3 - f.proxyAdmin.upgradeAuthorityAddressCount), 3) * 100 * 0.30) +
        (normalize(Math.max(0, 48 - f.proxyAdmin.upgradeDelayHours), 48) * 100 * 0.20) +
        (normalize(f.proxyAdmin.beaconChainDepth, 5) * 100 * 0.15) +
        ((f.proxyAdmin.timelockBypassVector ? 1 : 0) * 100 * 0.15) +
        (proxyPatternRisk * 0.10));
}
function lpUnlockRisk(f) {
    return clamp100((normalize(Math.max(0, f.lpUnlock.lpTopHolderConcentrationPct - 45), 55) * 100 * 0.35) +
        (normalize(Math.max(0, 180 - f.lpUnlock.daysToMajorUnlock), 180) * 100 * 0.20) +
        (normalize(f.lpUnlock.majorUnlockPercent, 100) * 100 * 0.15) +
        (normalize(f.lpUnlock.historicalUnlockViolations, 5) * 100 * 0.20) +
        ((f.lpUnlock.lpLockerVerified ? 0 : 1) * 100 * 0.10));
}
function walletTaintRisk(f) {
    return clamp100((normalize(f.walletTaint.taintedFundingLinks, 5) * 100 * 0.30) +
        (normalize(f.walletTaint.knownRugLaunchCount, 10) * 100 * 0.25) +
        (normalize(f.walletTaint.ponziAssociationCount, 10) * 100 * 0.15) +
        (normalize(f.walletTaint.suddenProtocolExposureCount, 50) * 100 * 0.10) +
        (normalize(f.walletTaint.coordinatedPatternScore, 100) * 100 * 0.20));
}
function adversarialRisk(f) {
    return clamp100((normalize(f.adversarial.maxIntPathVulnerabilities, 5) * 100 * 0.25) +
        (normalize(f.adversarial.flashloanInvariantBreaks, 5) * 100 * 0.25) +
        (normalize(f.adversarial.unexpectedCallOrderBreaks, 5) * 100 * 0.20) +
        ((f.adversarial.soleLpWithdrawalExploit ? 1 : 0) * 100 * 0.10) +
        (normalize(f.adversarial.economicInvariantViolations, 10) * 100 * 0.10) +
        (normalize(f.adversarial.estimatedExploitableLossUsd, 10000000) * 100 * 0.10));
}
function computeRiskBreakdown(_opportunity, f) {
    const bytecodeLayerRisk = bytecodeRisk(f);
    const proxyLayerRisk = proxyControlRisk(f);
    const lpLayerRisk = lpUnlockRisk(f);
    const walletLayerRisk = walletTaintRisk(f);
    const adversarialLayerRisk = adversarialRisk(f);
    const toxicityRisk = clamp100((f.honeypotProbability * 100 * 0.30) +
        (normalize(f.criticalAuditFindings, 5) * 100 * 0.25) +
        (normalize(f.unresolvedIncidents30d, 5) * 100 * 0.15) +
        (bytecodeLayerRisk * 0.15) +
        (walletLayerRisk * 0.15));
    const governanceControlRisk = clamp100((adminKeyRisk(f.adminKeyModel) * 0.25) +
        (upgradeabilityRisk(f.upgradeability) * 0.15) +
        (normalize(f.privilegedFunctionCount, 15) * 100 * 0.10) +
        (proxyLayerRisk * 0.50));
    const liquidityExitRisk = clamp100((normalize(Math.max(0, 70 - f.liquidityLockPercent), 70) * 100 * 0.20) +
        (normalize(Math.max(0, 30 - f.liquidityLockDays), 30) * 100 * 0.20) +
        (normalize(Math.max(0, f.top10HolderConcentrationPct - 45), 55) * 100 * 0.20) +
        (lpLayerRisk * 0.40));
    const marketIntegrityRisk = clamp100((f.washTradingScore * 0.20) +
        (normalize(Math.max(0, 55 - f.oracleDiversityScore), 55) * 100 * 0.20) +
        (normalize(Math.max(0, 90 - f.contractAgeDays), 365) * 100 * 0.10) +
        (walletLayerRisk * 0.50));
    const dependencyContagionRisk = clamp100((f.dependencyRiskScore * 0.65) +
        (normalize(Math.max(0, 65 - f.counterpartyReputationScore), 65) * 100 * 0.35));
    const attackSurfaceRisk = clamp100((bytecodeLayerRisk * 0.55) + (adversarialLayerRisk * 0.45));
    const aggregateRisk = clamp100((toxicityRisk * 0.24) +
        (governanceControlRisk * 0.20) +
        (liquidityExitRisk * 0.17) +
        (marketIntegrityRisk * 0.14) +
        (dependencyContagionRisk * 0.10) +
        (attackSurfaceRisk * 0.15));
    return {
        toxicityRisk,
        governanceControlRisk,
        liquidityExitRisk,
        marketIntegrityRisk,
        dependencyContagionRisk,
        attackSurfaceRisk,
        aggregateRisk,
    };
}
function hardBlocks(opportunity, f, risk) {
    const blocks = [];
    if (opportunity.opaque)
        blocks.push('opaque_structure');
    if (opportunity.exploitative)
        blocks.push('exploitative_posture');
    if (opportunity.counterpartyRisk === 'high')
        blocks.push('counterparty_risk_high');
    if (opportunity.structuralRisk === 'high')
        blocks.push('structural_risk_high');
    if (opportunity.liquidityScore < 50)
        blocks.push('liquidity_quality_below_floor');
    if (opportunity.edgeBps < 12)
        blocks.push('edge_below_floor');
    if (f.honeypotProbability >= 0.6)
        blocks.push('honeypot_probability_excessive');
    if (f.criticalAuditFindings >= 2)
        blocks.push('critical_audit_findings_unresolved');
    if (f.unresolvedIncidents30d > 0)
        blocks.push('recent_unresolved_incidents');
    if (f.bytecode.uncheckedOwnerDrainFunctions > 0)
        blocks.push('unchecked_owner_drain_functions');
    if (f.bytecode.selfdestructReachable)
        blocks.push('selfdestruct_reachable');
    if (f.bytecode.uninitializedProxyImplementation)
        blocks.push('uninitialized_proxy_implementation');
    if (f.proxyAdmin.upgradeAuthorityAddressCount <= 1 &&
        f.proxyAdmin.upgradeDelayHours < 24 &&
        f.proxyAdmin.timelockBypassVector) {
        blocks.push('single_actor_upgrade_with_timelock_bypass');
    }
    if (f.lpUnlock.lpTopHolderConcentrationPct >= 70 &&
        f.lpUnlock.daysToMajorUnlock <= 45 &&
        f.lpUnlock.majorUnlockPercent >= 60) {
        blocks.push('major_lp_unlock_concentration_cliff');
    }
    if (f.walletTaint.taintedFundingLinks > 0 && f.walletTaint.knownRugLaunchCount >= 2) {
        blocks.push('creator_wallet_taint_and_rug_history');
    }
    if (f.adversarial.flashloanInvariantBreaks > 0 || f.adversarial.economicInvariantViolations > 0) {
        blocks.push('adversarial_invariant_break_detected');
    }
    if (f.adversarial.estimatedExploitableLossUsd >= 1000000) {
        blocks.push('estimated_exploitable_loss_exceeds_threshold');
    }
    if (risk.aggregateRisk >= 75)
        blocks.push('aggregate_risk_excessive');
    return blocks;
}
function scoreOpportunity(opportunity, f, risk) {
    let score = opportunity.edgeBps + opportunity.liquidityScore / 2;
    score -= penaltyForRisk(opportunity.counterpartyRisk);
    score -= penaltyForRisk(opportunity.structuralRisk);
    if (opportunity.opaque)
        score -= 40;
    if (opportunity.exploitative)
        score -= 50;
    score -= risk.aggregateRisk * 0.45;
    score -= risk.attackSurfaceRisk * 0.10;
    score += clamp100(f.counterpartyReputationScore) * 0.12;
    score += clamp100(f.oracleDiversityScore) * 0.08;
    score += Math.min(f.contractAgeDays, 720) * 0.015;
    return Math.round(score * 100) / 100;
}
function inferConfidence(opportunity, f) {
    var _a, _b, _c, _d, _e;
    let observedSignals = 0;
    if ((_a = opportunity.forensics) === null || _a === void 0 ? void 0 : _a.bytecode)
        observedSignals += 1;
    if ((_b = opportunity.forensics) === null || _b === void 0 ? void 0 : _b.proxyAdmin)
        observedSignals += 1;
    if ((_c = opportunity.forensics) === null || _c === void 0 ? void 0 : _c.lpUnlock)
        observedSignals += 1;
    if ((_d = opportunity.forensics) === null || _d === void 0 ? void 0 : _d.walletTaint)
        observedSignals += 1;
    if ((_e = opportunity.forensics) === null || _e === void 0 ? void 0 : _e.adversarial)
        observedSignals += 1;
    if (observedSignals >= 5 && f.contractAgeDays >= 30)
        return 'high';
    if (observedSignals >= 3)
        return 'medium';
    return 'low';
}
function reasonCodes(opportunity, f, risk, hardBlockReasons, approved) {
    const reasons = [];
    if (opportunity.opaque)
        reasons.push('opaque structure rejects safe metabolism');
    if (opportunity.exploitative)
        reasons.push('exploitative posture violates moral boundary');
    if (opportunity.counterpartyRisk === 'high')
        reasons.push('high counterparty risk');
    if (opportunity.structuralRisk === 'high')
        reasons.push('high structural risk');
    if (opportunity.liquidityScore < 50)
        reasons.push('insufficient liquidity quality');
    if (opportunity.edgeBps < 12)
        reasons.push('insufficient edge for safe deployment');
    if (f.honeypotProbability >= 0.35)
        reasons.push('toxicity probability elevated');
    if (f.criticalAuditFindings > 0)
        reasons.push('critical audit findings present');
    if (f.unresolvedIncidents30d > 0)
        reasons.push('recent incidents unresolved');
    if (f.adminKeyModel === 'single_key' || f.upgradeability === 'unbounded') {
        reasons.push('governance control surface is too permissive');
    }
    if (f.top10HolderConcentrationPct > 45)
        reasons.push('holder concentration risk elevated');
    if (f.liquidityLockDays < 30 || f.liquidityLockPercent < 80)
        reasons.push('liquidity lock posture is weaker than preferred');
    if (risk.marketIntegrityRisk >= 55)
        reasons.push('market integrity risk elevated');
    if (risk.dependencyContagionRisk >= 50)
        reasons.push('dependency contagion risk elevated');
    if (risk.attackSurfaceRisk >= 50)
        reasons.push('attack surface risk elevated');
    if (hardBlockReasons.length > 0) {
        reasons.push(`hard blocks triggered: ${hardBlockReasons.join(', ')}`);
    }
    if (approved) {
        reasons.push('screen passes bounded multi-factor toxicity and control checks');
    }
    return reasons;
}
function screenOpportunity(opportunity) {
    const forensics = defaultForensics(opportunity.forensics);
    const riskBreakdown = computeRiskBreakdown(opportunity, forensics);
    const hardBlockReasons = hardBlocks(opportunity, forensics, riskBreakdown);
    const score = scoreOpportunity(opportunity, forensics, riskBreakdown);
    const confidence = inferConfidence(opportunity, forensics);
    const approved = hardBlockReasons.length === 0 && score >= 35;
    const reasons = reasonCodes(opportunity, forensics, riskBreakdown, hardBlockReasons, approved);
    return {
        opportunityId: opportunity.id,
        approved,
        score,
        reasons,
        hardBlocks: hardBlockReasons,
        confidence,
        riskBreakdown,
    };
}
exports.screenOpportunity = screenOpportunity;
function buildHeparSnapshot(opportunities) {
    const decisions = opportunities.map(screenOpportunity);
    return {
        implemented: true,
        screenedCount: opportunities.length,
        approvedCount: decisions.filter((decision) => decision.approved).length,
        decisions,
    };
}
exports.buildHeparSnapshot = buildHeparSnapshot;
//# sourceMappingURL=hepar.js.map