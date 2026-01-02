import { EvidenceItem } from './EvidenceItem';

export interface EvidenceReport {
  id: string;
  items: EvidenceItem[];
  coverage_summary: string;
  confidence_score: number;
  limitations: string[];
  assumptions: string[];
  created_at: string;
}

export function createEvidenceReport(params: {
  id: string;
  items: EvidenceItem[];
  coverage_summary: string;
  confidence_score: number;
  limitations: string[];
  assumptions: string[];
}): EvidenceReport {
  return {
    ...params,
    created_at: new Date().toISOString(),
  };
}
