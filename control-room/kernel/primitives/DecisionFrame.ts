import { getAllowedActions, getBlockedActions, getRiskLevel } from './ConfidenceRubric';
import { EvidenceTier, GovernanceActionClass, ApprovalState, ApprovalRoute } from './GovernanceTypes';
import { determineActionClass, advanceApprovalState } from '../policies/actionClassPolicy';

export type DecisionStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'revoked';

export interface DecisionFrame {
  id: string;
  objective: string;
  recommendation: string;
  evidence_report_id: string;
  evidence_tier: EvidenceTier;
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high';
  allowed_actions: string[];
  blocked_actions: string[];
  action_class: GovernanceActionClass;
  approval_route: ApprovalRoute;
  approval_state: ApprovalState;
  approval_required: true;
  status: DecisionStatus;
  approver_id?: string;
  approval_timestamp?: string;
  created_at: string;
}

export function createDecisionFrame(params: {
  id: string;
  objective: string;
  recommendation: string;
  evidence_report_id: string;
  evidence_tier: EvidenceTier;
  confidence_score: number;
}): DecisionFrame {
  const risk_level = getRiskLevel(params.confidence_score);
  const allowed_actions = getAllowedActions(params.confidence_score);
  const blocked_actions = getBlockedActions(params.confidence_score);
  const actionClass = determineActionClass({
    confidence_score: params.confidence_score,
    evidence_tier: params.evidence_tier,
    reversible: true,
    impact: risk_level === 'high' ? 'high' : risk_level === 'medium' ? 'medium' : 'low',
  });

  return {
    ...params,
    risk_level,
    allowed_actions,
    blocked_actions,
    action_class: actionClass.action_class,
    approval_route: actionClass.approval_route,
    approval_state: actionClass.approval_state,
    approval_required: true,
    status: 'draft',
    created_at: new Date().toISOString(),
  };
}

export function approveDecisionFrame(
  frame: DecisionFrame,
  approver_id: string
): DecisionFrame {
  if (frame.status !== 'pending_review') {
    throw new Error('Can only approve DecisionFrames in pending_review status');
  }

  return {
    ...frame,
    status: 'approved',
    approval_state: advanceApprovalState(frame.action_class, 'approved'),
    approver_id,
    approval_timestamp: new Date().toISOString(),
  };
}

export function rejectDecisionFrame(
  frame: DecisionFrame,
  approver_id: string
): DecisionFrame {
  if (frame.status !== 'pending_review') {
    throw new Error('Can only reject DecisionFrames in pending_review status');
  }

  return {
    ...frame,
    status: 'rejected',
    approval_state: advanceApprovalState(frame.action_class, 'rejected'),
    approver_id,
    approval_timestamp: new Date().toISOString(),
  };
}

export function revokeDecisionFrame(
  frame: DecisionFrame,
  approver_id: string
): DecisionFrame {
  if (frame.status !== 'approved') {
    throw new Error('Can only revoke an approved DecisionFrame');
  }

  return {
    ...frame,
    status: 'revoked',
    approval_state: advanceApprovalState(frame.action_class, 'revoked'),
    approver_id,
    approval_timestamp: new Date().toISOString(),
  };
}

export function transitionToReview(frame: DecisionFrame): DecisionFrame {
  if (frame.status !== 'draft') {
    throw new Error('Can only transition to review from draft status');
  }

  return {
    ...frame,
    status: 'pending_review',
    approval_state: advanceApprovalState(frame.action_class, 'pending_review'),
  };
}
