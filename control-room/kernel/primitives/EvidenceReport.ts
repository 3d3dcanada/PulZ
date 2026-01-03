import { EvidenceItem } from './EvidenceItem';
import { EvidenceTier } from './GovernanceTypes';
import { determineEvidenceTier } from '../policies/evidencePolicy';

export interface EvidenceReport {
  id: string;
  items: EvidenceItem[];
  coverage_summary: string;
  confidence_score: number;
  evidence_tier: EvidenceTier;
  limitations: string[];
  assumptions: string[];
  created_at: string;
}

export function createEvidenceReport(params: {
  id: string;
  items: EvidenceItem[];
  coverage_summary: string;
  confidence_score: number;
  evidence_tier?: EvidenceTier;
  limitations: string[];
  assumptions: string[];
}): EvidenceReport {
  const derivedTier = params.evidence_tier ?? determineEvidenceTier(params.items, params.confidence_score).tier;
  return {
    ...params,
    evidence_tier: derivedTier,
    created_at: new Date().toISOString(),
  };
}
