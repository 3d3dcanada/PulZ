import { DecisionFrame, DecisionStatus } from '../primitives/DecisionFrame';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDecisionFrame(frame: DecisionFrame): ValidationResult {
  const errors: string[] = [];

  if (!frame.id || frame.id.trim() === '') {
    errors.push('DecisionFrame must have a non-empty id');
  }

  if (!frame.objective || frame.objective.trim() === '') {
    errors.push('DecisionFrame must have a non-empty objective');
  }

  if (!frame.recommendation || frame.recommendation.trim() === '') {
    errors.push('DecisionFrame must have a non-empty recommendation');
  }

  if (!frame.evidence_report_id || frame.evidence_report_id.trim() === '') {
    errors.push('DecisionFrame must reference an evidence_report_id');
  }

  if (!['tier_1', 'tier_2', 'tier_3'].includes(frame.evidence_tier)) {
    errors.push('DecisionFrame evidence_tier must be tier_1, tier_2, or tier_3');
  }

  if (typeof frame.confidence_score !== 'number' || frame.confidence_score < 0 || frame.confidence_score > 100) {
    errors.push('DecisionFrame confidence_score must be a number between 0 and 100');
  }

  if (!['low', 'medium', 'high'].includes(frame.risk_level)) {
    errors.push('DecisionFrame risk_level must be low, medium, or high');
  }

  if (!Array.isArray(frame.allowed_actions)) {
    errors.push('DecisionFrame allowed_actions must be an array');
  }

  if (!Array.isArray(frame.blocked_actions)) {
    errors.push('DecisionFrame blocked_actions must be an array');
  }

  if (!['A', 'B', 'C'].includes(frame.action_class)) {
    errors.push('DecisionFrame action_class must be A, B, or C');
  }

  if (!['log_and_learn', 'single_approval', 'multi_gate'].includes(frame.approval_route)) {
    errors.push('DecisionFrame approval_route must be log_and_learn, single_approval, or multi_gate');
  }

  if (!['log_only', 'drafted', 'awaiting_single_approval', 'awaiting_multi_gate', 'approved', 'blocked', 'rejected'].includes(frame.approval_state)) {
    errors.push('DecisionFrame approval_state must be a valid governance state');
  }

  if (frame.approval_required !== true) {
    errors.push('DecisionFrame approval_required must always be true');
  }

  if (!['draft', 'pending_review', 'approved', 'rejected', 'revoked'].includes(frame.status)) {
    errors.push('DecisionFrame status must be draft, pending_review, approved, rejected, or revoked');
  }

  if (frame.status === 'approved' && !frame.approver_id) {
    errors.push('Approved DecisionFrame must have approver_id');
  }

  if (frame.status === 'approved' && !frame.approval_timestamp) {
    errors.push('Approved DecisionFrame must have approval_timestamp');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function canTransition(from: DecisionStatus, to: DecisionStatus): boolean {
  const allowedTransitions: Record<DecisionStatus, DecisionStatus[]> = {
    draft: ['pending_review'],
    pending_review: ['approved', 'rejected'],
    approved: ['revoked'],
    rejected: [],
    revoked: [],
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}

export function validateStatusTransition(
  currentStatus: DecisionStatus,
  newStatus: DecisionStatus
): ValidationResult {
  const errors: string[] = [];

  if (!canTransition(currentStatus, newStatus)) {
    errors.push(
      `Invalid status transition: ${currentStatus} -> ${newStatus}. ` +
      `Allowed transitions from ${currentStatus}: ${getAllowedTransitions(currentStatus).join(', ') || 'none'}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function getAllowedTransitions(status: DecisionStatus): DecisionStatus[] {
  const allowedTransitions: Record<DecisionStatus, DecisionStatus[]> = {
    draft: ['pending_review'],
    pending_review: ['approved', 'rejected'],
    approved: ['revoked'],
    rejected: [],
    revoked: [],
  };

  return allowedTransitions[status] || [];
}
