import fs from 'fs';
import path from 'path';
import seedConfig from '../config/metadata.example.json';
import { AgentNftCollectionConfig, AgentNftSnapshot } from './types';

export function buildAgentNftSnapshot(config: AgentNftCollectionConfig): AgentNftSnapshot {
  const roleCoverage = Array.from(new Set(config.tokens.map((token) => token.organ)));
  const readyCount = config.tokens.filter((token) => token.metadataStatus === 'defined').length;

  return {
    implemented: true,
    localAnalysisOnly: true,
    collectionDefined: Boolean(config.collectionName),
    collectionName: config.collectionName,
    mintLive: false,
    metadataCount: config.tokens.length,
    readyCount,
    roleCoverage,
    pendingActions: [
      'keep NFT minting blocked until live Keys activation exists',
      'preserve non-transferable identity posture for organ-bound keys',
    ],
    tokens: config.tokens,
  };
}

export function loadLocalAgentNftSnapshot(packageRoot: string): AgentNftSnapshot {
  const filePath = path.resolve(packageRoot, 'keys-nft-core', 'config', 'metadata.example.json');
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as AgentNftCollectionConfig;
  return buildAgentNftSnapshot(parsed);
}

export function loadExampleAgentNftSnapshot(): AgentNftSnapshot {
  return buildAgentNftSnapshot(seedConfig as AgentNftCollectionConfig);
}
