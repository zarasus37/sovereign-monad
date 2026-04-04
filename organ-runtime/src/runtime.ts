import pino from 'pino';
import { getServiceConfig, loadRuntimeConfig } from './config';
import { buildRuntimeSnapshot } from './coordinator';
import { OrganRuntimeSnapshot } from './types';

export class OrganRuntime {
  private readonly logger = pino({ level: getServiceConfig().logLevel });

  snapshot(): OrganRuntimeSnapshot {
    const serviceConfig = getServiceConfig();
    const runtimeConfig = loadRuntimeConfig(serviceConfig.runtimeConfigPath);
    runtimeConfig.runtimeMode = serviceConfig.runtimeMode;
    return buildRuntimeSnapshot(runtimeConfig);
  }

  run(): OrganRuntimeSnapshot {
    const snapshot = this.snapshot();
    this.logger.info(
      {
        runtimeMode: snapshot.runtimeMode,
        zeroCapitalBuildQueue: snapshot.zeroCapitalBuildQueue,
        capitalGatedQueue: snapshot.capitalGatedQueue,
        coordinationLoop: snapshot.coordinationLoop,
      },
      'organ-runtime snapshot',
    );

    if (snapshot.synapse) {
      this.logger.info(
        {
          implemented: snapshot.synapse.implemented,
          sampleSignalCount: snapshot.synapse.sampleSignalCount,
          routeDecisions: snapshot.synapse.routeDecisions,
        },
        'synapse routing snapshot',
      );
    }

    if (snapshot.hepar) {
      this.logger.info(
        {
          screenedCount: snapshot.hepar.screenedCount,
          approvedCount: snapshot.hepar.approvedCount,
          decisions: snapshot.hepar.decisions,
        },
        'hepar screening snapshot',
      );
    }

    if (snapshot.cortex) {
      this.logger.info(
        {
          sourceCount: snapshot.cortex.sourceCount,
          briefs: snapshot.cortex.briefs,
        },
        'cortex synthesis snapshot',
      );
    }

    if (snapshot.vox) {
      this.logger.info(
        {
          requestCount: snapshot.vox.requestCount,
          packages: snapshot.vox.packages,
        },
        'vox narrative snapshot',
      );
    }

    snapshot.organs.forEach((organ) => {
      this.logger.info(
        {
          organ: organ.name,
          role: organ.ecosystemRole,
          biologicalAnalog: organ.biologicalAnalog,
          zeroCapitalReady: organ.zeroCapitalReady,
          blockedReasons: organ.blockedReasons,
        },
        'organ readiness',
      );
    });

    return snapshot;
  }
}
