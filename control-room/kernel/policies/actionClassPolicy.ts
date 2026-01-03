import { EvidenceTier, GovernanceActionClass, ApprovalRoute, ApprovalState, GOVERNANCE_ACTION_CLASS_DEFINITIONS } from '../primitives/GovernanceTypes';

export interface ActionClassInput {
  confidence_score: number;
  evidence_tier: EvidenceTier;
  reversible: boolean;
  impact: 'low' | 'medium' | 'high';
}

export interface ActionClassResult {
  action_class: GovernanceActionClass;
  approval_route: ApprovalRoute;
  approval_state: ApprovalState;
  notes: string[];
}

export function determineActionClass(input: ActionClassInput): ActionClassResult {
  const notes: string[] = [];

  if (input.confidence_score < 50) {
    notes.push('Confidence below minimum threshold; decision blocked.');
    return {
      action_class: 'A',
      approval_route: 'log_and_learn',
      approval_state: 'blocked',
      notes,
    };
  }

  if (input.evidence_tier === 'tier_1' && input.impact === 'low' && input.reversible) {
    notes.push('Low impact with limited evidence. Log + learn only.');
    return {
      action_class: 'A',
      approval_route: GOVERNANCE_ACTION_CLASS_DEFINITIONS.A.approval_route,
      approval_state: 'log_only',
      notes,
    };
  }

  if (input.impact === 'high' || !input.reversible || input.evidence_tier === 'tier_3') {
    notes.push('High impact or irreversible change detected. Multi-gate required.');
    return {
      action_class: 'C',
      approval_route: GOVERNANCE_ACTION_CLASS_DEFINITIONS.C.approval_route,
      approval_state: 'drafted',
      notes,
    };
  }

  notes.push('Moderate impact with verified evidence. Single approval required.');
  return {
    action_class: 'B',
    approval_route: GOVERNANCE_ACTION_CLASS_DEFINITIONS.B.approval_route,
    approval_state: 'drafted',
    notes,
  };
}

export function advanceApprovalState(
  actionClass: GovernanceActionClass,
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'revoked'
): ApprovalState {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'revoked') return 'blocked';

  if (actionClass === 'A') return 'log_only';
  if (status === 'pending_review') {
    return actionClass === 'C' ? 'awaiting_multi_gate' : 'awaiting_single_approval';
  }

  return 'drafted';
}
