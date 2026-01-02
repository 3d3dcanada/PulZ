export type EvidenceType = 'document' | 'user_input' | 'external_source' | 'system_observation';

export interface EvidenceItemSource {
  kind: string;
  ref: string;
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  source: EvidenceItemSource;
  excerpt: string;
  timestamp: string;
  confidence_weight: number;
  verified: boolean;
}

export function createEvidenceItem(params: {
  id: string;
  type: EvidenceType;
  source: EvidenceItemSource;
  excerpt: string;
  confidence_weight: number;
  verified: boolean;
}): EvidenceItem {
  return {
    ...params,
    timestamp: new Date().toISOString(),
  };
}
