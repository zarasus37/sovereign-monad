"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganRuntime = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("./config");
const coordinator_1 = require("./coordinator");
class OrganRuntime {
    logger = (0, pino_1.default)({ level: (0, config_1.getServiceConfig)().logLevel });
    snapshot() {
        const serviceConfig = (0, config_1.getServiceConfig)();
        const runtimeConfig = (0, config_1.loadRuntimeConfig)(serviceConfig.runtimeConfigPath);
        runtimeConfig.runtimeMode = serviceConfig.runtimeMode;
        return (0, coordinator_1.buildRuntimeSnapshot)(runtimeConfig);
    }
    run() {
        const snapshot = this.snapshot();
        this.logger.info({
            runtimeMode: snapshot.runtimeMode,
            zeroCapitalBuildQueue: snapshot.zeroCapitalBuildQueue,
            capitalGatedQueue: snapshot.capitalGatedQueue,
            coordinationLoop: snapshot.coordinationLoop,
        }, 'organ-runtime snapshot');
        if (snapshot.synapse) {
            this.logger.info({
                implemented: snapshot.synapse.implemented,
                sampleSignalCount: snapshot.synapse.sampleSignalCount,
                routeDecisions: snapshot.synapse.routeDecisions,
            }, 'synapse routing snapshot');
        }
        if (snapshot.synapseAdaptive) {
            this.logger.info({
                signalCount: snapshot.synapseAdaptive.signalCount,
                escalations: snapshot.synapseAdaptive.escalations,
                policyUsed: snapshot.synapseAdaptive.policyUsed,
                sourceWeights: snapshot.synapseAdaptive.sourceWeights,
                conflicts: snapshot.synapseAdaptive.conflicts,
                routes: snapshot.synapseAdaptive.routes,
            }, 'synapse adaptive routing snapshot');
        }
        if (snapshot.hepar) {
            this.logger.info({
                screenedCount: snapshot.hepar.screenedCount,
                approvedCount: snapshot.hepar.approvedCount,
                decisions: snapshot.hepar.decisions,
            }, 'hepar screening snapshot');
        }
        if (snapshot.heparConsensus) {
            this.logger.info({
                campaignCount: snapshot.heparConsensus.campaignCount,
                decisionBandCounts: snapshot.heparConsensus.decisionBandCounts,
                results: snapshot.heparConsensus.results,
            }, 'hepar consensus snapshot');
        }
        if (snapshot.cortex) {
            this.logger.info({
                sourceCount: snapshot.cortex.sourceCount,
                briefs: snapshot.cortex.briefs,
            }, 'cortex synthesis snapshot');
        }
        if (snapshot.cortexStrategic) {
            this.logger.info({
                contextCount: snapshot.cortexStrategic.contextCount,
                averageStressIndex: snapshot.cortexStrategic.averageStressIndex,
                reports: snapshot.cortexStrategic.reports,
            }, 'cortex strategic snapshot');
        }
        if (snapshot.vox) {
            this.logger.info({
                requestCount: snapshot.vox.requestCount,
                packages: snapshot.vox.packages,
            }, 'vox narrative snapshot');
        }
        if (snapshot.voxIntelligence) {
            this.logger.info({
                inputCount: snapshot.voxIntelligence.inputCount,
                packageCount: snapshot.voxIntelligence.packageCount,
                verifiedCount: snapshot.voxIntelligence.verifiedCount,
                conflictedCount: snapshot.voxIntelligence.conflictedCount,
                packages: snapshot.voxIntelligence.packages,
            }, 'vox narrative intelligence snapshot');
        }
        if (snapshot.pneuma) {
            this.logger.info({
                leadCount: snapshot.pneuma.leadCount,
                acceptedCount: snapshot.pneuma.acceptedCount,
                decisions: snapshot.pneuma.decisions,
            }, 'pneuma exchange snapshot');
        }
        if (snapshot.pneumaMarket) {
            this.logger.info({
                orderCount: snapshot.pneumaMarket.orderCount,
                acceptedCount: snapshot.pneumaMarket.acceptedCount,
                fillRatio: snapshot.pneumaMarket.fillRatio,
                averageCostBps: snapshot.pneumaMarket.averageCostBps,
                policyUsed: snapshot.pneumaMarket.policyUsed,
                decisions: snapshot.pneumaMarket.decisions,
                feedbackSignals: snapshot.pneumaMarket.feedbackSignals,
            }, 'pneuma market intelligence snapshot');
        }
        if (snapshot.cardia) {
            this.logger.info({
                reserveHealthy: snapshot.cardia.reserveHealthy,
                deploymentMode: snapshot.cardia.deploymentMode,
                decisions: snapshot.cardia.decisions,
            }, 'cardia capital-band snapshot');
        }
        if (snapshot.cardiaAdaptive) {
            this.logger.info({
                candidateCount: snapshot.cardiaAdaptive.candidateCount,
                netAllocationUsd: snapshot.cardiaAdaptive.netAllocationUsd,
                blockedCount: snapshot.cardiaAdaptive.blockedCount,
                coefficientsUsed: snapshot.cardiaAdaptive.coefficientsUsed,
                stressActions: snapshot.cardiaAdaptive.stressActions,
                decisions: snapshot.cardiaAdaptive.decisions,
            }, 'cardia adaptive allocation snapshot');
        }
        if (snapshot.orchestration) {
            this.logger.info({
                phases: snapshot.orchestration.phases,
                bottlenecks: snapshot.orchestration.bottlenecks,
            }, 'orchestration hardening snapshot');
        }
        if (snapshot.participation) {
            this.logger.info({
                actorCount: snapshot.participation.actorCount,
                decisions: snapshot.participation.decisions,
            }, 'human-agent participation boundary snapshot');
        }
        if (snapshot.mandate) {
            this.logger.info({
                title: snapshot.mandate.title,
                status: snapshot.mandate.status,
                sequence: snapshot.mandate.sequence,
                gateChecks: snapshot.mandate.gateChecks,
            }, 'first bounded mandate snapshot');
        }
        if (snapshot.revenue) {
            this.logger.info({
                thesis: snapshot.revenue.thesis,
                offers: snapshot.revenue.offers,
            }, 'revenue packaging snapshot');
        }
        if (snapshot.homeostasis) {
            this.logger.info({
                healthy: snapshot.homeostasis.healthy,
                metricCount: snapshot.homeostasis.metricCount,
                breaches: snapshot.homeostasis.breaches,
            }, 'homeostasis snapshot');
        }
        if (snapshot.signaling) {
            this.logger.info({
                fastLaneSignalIds: snapshot.signaling.fastLaneSignalIds,
                slowLaneSignalIds: snapshot.signaling.slowLaneSignalIds,
            }, 'mixed-speed signaling snapshot');
        }
        if (snapshot.immune) {
            this.logger.info({
                incidentCount: snapshot.immune.incidentCount,
                barrierTriggerCount: snapshot.immune.barrierTriggerCount,
                repairQueueCount: snapshot.immune.repairQueueCount,
                decisions: snapshot.immune.decisions,
            }, 'immune barrier repair snapshot');
        }
        snapshot.organs.forEach((organ) => {
            this.logger.info({
                organ: organ.name,
                role: organ.ecosystemRole,
                biologicalAnalog: organ.biologicalAnalog,
                zeroCapitalReady: organ.zeroCapitalReady,
                blockedReasons: organ.blockedReasons,
            }, 'organ readiness');
        });
        return snapshot;
    }
}
exports.OrganRuntime = OrganRuntime;
