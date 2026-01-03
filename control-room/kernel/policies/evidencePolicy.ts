import { EvidenceItem } from '../primitives/EvidenceItem';
import { EvidenceTier } from '../primitives/GovernanceTypes';

export interface EvidenceTierResult {
  tier: EvidenceTier;
  verified_count: number;
  total_count: number;
}

export function determineEvidenceTier(
  items: EvidenceItem[],
  confidenceScore: number
): EvidenceTierResult {
  const verifiedCount = items.filter((item) => item.verified).length;
  const totalCount = items.length;

  if (confidenceScore >= 85 && verifiedCount >= 3) {
    return { tier: 'tier_3', verified_count: verifiedCount, total_count: totalCount };
  }

  if (confidenceScore >= 60 && verifiedCount >= 2) {
    return { tier: 'tier_2', verified_count: verifiedCount, total_count: totalCount };
  }

  return { tier: 'tier_1', verified_count: verifiedCount, total_count: totalCount };
}

export function isEvidenceTierAtLeast(current: EvidenceTier, required: EvidenceTier): boolean {
  const order: Record<EvidenceTier, number> = {
    tier_1: 1,
    tier_2: 2,
    tier_3: 3,
  };

  return order[current] >= order[required];
}
