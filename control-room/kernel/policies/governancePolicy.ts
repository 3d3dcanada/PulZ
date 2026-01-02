import { DecisionFrame, DecisionStatus } from '../primitives/DecisionFrame';
import { canTransition } from '../validators/decisionValidator';

export interface GovernanceCheck {
  passed: boolean;
  violations: string[];
}

export function checkApprovalRequirements(frame: DecisionFrame): GovernanceCheck {
  const violations: string[] = [];

  if (frame.status === 'approved') {
    if (!frame.approver_id) {
      violations.push('Approved decision must have approver_id');
    }
    if (!frame.approval_timestamp) {
      violations.push('Approved decision must have approval_timestamp');
    }
  }

  if (frame.status === 'rejected') {
    if (!frame.approver_id) {
      violations.push('Rejected decision must have approver_id');
    }
    if (!frame.approval_timestamp) {
      violations.push('Rejected decision must have approval_timestamp');
    }
  }

  if (frame.status === 'revoked') {
    if (!frame.approver_id) {
      violations.push('Revoked decision must have approver_id');
    }
    if (!frame.approval_timestamp) {
      violations.push('Revoked decision must have approval_timestamp');
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function checkEvidenceRequirements(frame: DecisionFrame): GovernanceCheck {
  const violations: string[] = [];

  if (!frame.evidence_report_id || frame.evidence_report_id.trim() === '') {
    violations.push('Decision must reference a valid evidence report');
  }

  if (frame.confidence_score < 50) {
    violations.push('Confidence score below minimum threshold (50) - decision blocked');
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function checkStatusTransition(
  currentStatus: DecisionStatus,
  newStatus: DecisionStatus
): GovernanceCheck {
  const violations: string[] = [];

  if (!canTransition(currentStatus, newStatus)) {
    violations.push(
      `Status transition ${currentStatus} -> ${newStatus} not permitted by governance policy`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function enforceNoSilentExecution(frame: DecisionFrame): GovernanceCheck {
  const violations: string[] = [];

  if (frame.status === 'approved' && frame.approval_required !== true) {
    violations.push('Cannot execute without approval_required=true');
  }

  if (frame.blocked_actions.includes('execute_without_approval')) {
    const hasUnapprovedExecution = frame.status === 'draft' || frame.status === 'pending_review';
    if (hasUnapprovedExecution) {
      violations.push('Execution blocked - approval required before any action');
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function runAllGovernanceChecks(frame: DecisionFrame): GovernanceCheck {
  const approvalCheck = checkApprovalRequirements(frame);
  const evidenceCheck = checkEvidenceRequirements(frame);
  const executionCheck = enforceNoSilentExecution(frame);

  const allViolations = [
    ...approvalCheck.violations,
    ...evidenceCheck.violations,
    ...executionCheck.violations,
  ];

  return {
    passed: allViolations.length === 0,
    violations: allViolations,
  };
}
