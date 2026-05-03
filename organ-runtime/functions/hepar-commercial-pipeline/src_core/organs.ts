import { OrganDefinition, OrganName } from './types';

export const ORGAN_DEFINITIONS: Record<OrganName, OrganDefinition> = {
  Cardia: {
    name: 'Cardia',
    biologicalAnalog: 'Heart / circulatory system',
    ecosystemRole: 'Capital Circulator',
    primaryOutput: 'Safe capital movement and reserve rhythm',
    dependencies: ['Hepar', 'Synapse', 'Cortex'],
    capitalRequired: true,
  },
  Pneuma: {
    name: 'Pneuma',
    biologicalAnalog: 'Lungs / respiratory interface',
    ecosystemRole: 'External Exchange Operator',
    primaryOutput: 'Leads, partnerships, distribution, converted demand',
    dependencies: ['Vox', 'Cortex'],
    capitalRequired: false,
  },
  Hepar: {
    name: 'Hepar',
    biologicalAnalog: 'Liver / metabolic filter',
    ecosystemRole: 'Opportunity Refiner',
    primaryOutput: 'Screened mandates and rejected toxic opportunities',
    dependencies: ['Synapse'],
    capitalRequired: false,
  },
  Cortex: {
    name: 'Cortex',
    biologicalAnalog: 'Cerebral cortex',
    ecosystemRole: 'Research Synthesist',
    primaryOutput: 'Usable intelligence and strategic models',
    dependencies: ['Synapse'],
    capitalRequired: false,
  },
  Synapse: {
    name: 'Synapse',
    biologicalAnalog: 'Nervous system',
    ecosystemRole: 'Signal Router',
    primaryOutput: 'Priority routing, timing, coordination',
    dependencies: [],
    capitalRequired: false,
  },
  Vox: {
    name: 'Vox',
    biologicalAnalog: 'Larynx / vocal apparatus',
    ecosystemRole: 'Narrative Interface',
    primaryOutput: 'Content, explanation, public legibility',
    dependencies: ['Cortex'],
    capitalRequired: false,
  },
};
