export type GovernanceActionClass = 'A' | 'B' | 'C';

export type ApprovalState =
  | 'log_only'
  | 'drafted'
  | 'awaiting_single_approval'
  | 'awaiting_multi_gate'
  | 'approved'
  | 'blocked'
  | 'rejected';

export type EvidenceTier = 'tier_1' | 'tier_2' | 'tier_3';

export type ApprovalRoute = 'log_and_learn' | 'single_approval' | 'multi_gate';

export const GOVERNANCE_ACTION_CLASS_DEFINITIONS: Record<GovernanceActionClass, {
  label: string;
  summary: string;
  approval_route: ApprovalRoute;
}> = {
  A: {
    label: 'Type A',
    summary: 'Log + learn only. No execution path.',
    approval_route: 'log_and_learn',
  },
  B: {
    label: 'Type B',
    summary: 'Draft + single approval required.',
    approval_route: 'single_approval',
  },
  C: {
    label: 'Type C',
    summary: 'Full evidence + multi-gate approval required.',
    approval_route: 'multi_gate',
  },
};

export const EVIDENCE_TIER_DEFINITIONS: Record<EvidenceTier, string> = {
  tier_1: 'Single-source or uncorroborated evidence. Suitable for logging only.',
  tier_2: 'Multi-source evidence with partial verification. Suitable for single approval.',
  tier_3: 'Multi-source, verified evidence with traceable provenance.',
};
