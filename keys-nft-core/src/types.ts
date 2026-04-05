export interface AgentNftDescriptor {
  tokenId: string;
  organ: string;
  role: 'organ_identity' | 'participation_key';
  metadataStatus: 'defined' | 'draft';
  transferability: 'non_transferable' | 'review_only';
  delegateCapable: boolean;
}

export interface AgentNftCollectionConfig {
  collectionName: string;
  networkLive: false;
  tokens: AgentNftDescriptor[];
}

export interface AgentNftSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  collectionDefined: boolean;
  collectionName: string;
  mintLive: false;
  metadataCount: number;
  readyCount: number;
  roleCoverage: string[];
  pendingActions: string[];
  tokens: AgentNftDescriptor[];
}
