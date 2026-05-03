"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenOpportunity = screenOpportunity;
exports.buildHeparSnapshot = buildHeparSnapshot;
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
    return {
        bytecode: {
            uncheckedOwnerDrainFunctions: input?.bytecode?.uncheckedOwnerDrainFunctions ?? 0,
            hiddenPauseMechanisms: input?.bytecode?.hiddenPauseMechanisms ?? false,
            selfdestructReachable: input?.bytecode?.selfdestructReachable ?? false,
            uninitializedProxyImplementation: input?.bytecode?.uninitializedProxyImplementation ?? false,
            ownerAddressCount: input?.bytecode?.ownerAddressCount ?? 3,
            ownerConcentrationScore: input?.bytecode?.ownerConcentrationScore ?? 25,
        },
        proxyAdmin: {
            proxyAdminPresent: input?.proxyAdmin?.proxyAdminPresent ?? true,
            upgradeAuthorityAddressCount: input?.proxyAdmin?.upgradeAuthorityAddressCount ?? 3,
            upgradeDelayHours: input?.proxyAdmin?.upgradeDelayHours ?? 48,
            proxyPattern: input?.proxyAdmin?.proxyPattern ?? 'transparent',
            beaconChainDepth: input?.proxyAdmin?.beaconChainDepth ?? 0,
            timelockBypassVector: input?.proxyAdmin?.timelockBypassVector ?? false,
        },
        lpUnlock: {
            lpTopHolderConcentrationPct: input?.lpUnlock?.lpTopHolderConcentrationPct ?? 35,
            daysToMajorUnlock: input?.lpUnlock?.daysToMajorUnlock ?? 180,
            majorUnlockPercent: input?.lpUnlock?.majorUnlockPercent ?? 20,
            historicalUnlockViolations: input?.lpUnlock?.historicalUnlockViolations ?? 0,
            lpLockerVerified: input?.lpUnlock?.lpLockerVerified ?? true,
        },
        walletTaint: {
            taintedFundingLinks: input?.walletTaint?.taintedFundingLinks ?? 0,
            knownRugLaunchCount: input?.walletTaint?.knownRugLaunchCount ?? 0,
            ponziAssociationCount: input?.walletTaint?.ponziAssociationCount ?? 0,
            suddenProtocolExposureCount: input?.walletTaint?.suddenProtocolExposureCount ?? 0,
            coordinatedPatternScore: input?.walletTaint?.coordinatedPatternScore ?? 10,
        },
        adversarial: {
            maxIntPathVulnerabilities: input?.adversarial?.maxIntPathVulnerabilities ?? 0,
            flashloanInvariantBreaks: input?.adversarial?.flashloanInvariantBreaks ?? 0,
            unexpectedCallOrderBreaks: input?.adversarial?.unexpectedCallOrderBreaks ?? 0,
            soleLpWithdrawalExploit: input?.adversarial?.soleLpWithdrawalExploit ?? false,
            economicInvariantViolations: input?.adversarial?.economicInvariantViolations ?? 0,
            estimatedExploitableLossUsd: input?.adversarial?.estimatedExploitableLossUsd ?? 0,
        },
        honeypotProbability: input?.honeypotProbability ?? 0,
        criticalAuditFindings: input?.criticalAuditFindings ?? 0,
        unresolvedIncidents30d: input?.unresolvedIncidents30d ?? 0,
        top10HolderConcentrationPct: input?.top10HolderConcentrationPct ?? 35,
        liquidityLockDays: input?.liquidityLockDays ?? 30,
        liquidityLockPercent: input?.liquidityLockPercent ?? 80,
        adminKeyModel: input?.adminKeyModel ?? 'multisig_timelocked',
        upgradeability: input?.upgradeability ?? 'timelocked',
        privilegedFunctionCount: input?.privilegedFunctionCount ?? 2,
        oracleDiversityScore: input?.oracleDiversityScore ?? 70,
        washTradingScore: input?.washTradingScore ?? 20,
        dependencyRiskScore: input?.dependencyRiskScore ?? 20,
        counterpartyReputationScore: input?.counterpartyReputationScore ?? 70,
        contractAgeDays: input?.contractAgeDays ?? 180,
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
        (normalize(f.adversarial.estimatedExploitableLossUsd, 10_000_000) * 100 * 0.10));
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
    if (f.adversarial.estimatedExploitableLossUsd >= 1_000_000) {
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
    let observedSignals = 0;
    if (opportunity.forensics?.bytecode)
        observedSignals += 1;
    if (opportunity.forensics?.proxyAdmin)
        observedSignals += 1;
    if (opportunity.forensics?.lpUnlock)
        observedSignals += 1;
    if (opportunity.forensics?.walletTaint)
        observedSignals += 1;
    if (opportunity.forensics?.adversarial)
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
function buildHeparSnapshot(opportunities) {
    const decisions = opportunities.map(screenOpportunity);
    return {
        implemented: true,
        screenedCount: opportunities.length,
        approvedCount: decisions.filter((decision) => decision.approved).length,
        decisions,
    };
}
