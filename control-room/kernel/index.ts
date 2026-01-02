export {
  type EvidenceType,
  type EvidenceItemSource,
  type EvidenceItem,
  createEvidenceItem,
} from './primitives/EvidenceItem';

export {
  type EvidenceReport,
  createEvidenceReport,
} from './primitives/EvidenceReport';

export {
  type ActionClass,
  type ConfidenceLevel,
  CONFIDENCE_RUBRIC,
  getActionClass,
  getAllowedActions,
  getBlockedActions,
  getRiskLevel,
} from './primitives/ConfidenceRubric';

export {
  type DecisionStatus,
  type DecisionFrame,
  createDecisionFrame,
  approveDecisionFrame,
  rejectDecisionFrame,
  revokeDecisionFrame,
  transitionToReview,
} from './primitives/DecisionFrame';

export {
  type ActorType,
  type Actor,
  type RelatedEntity,
  type AuditEvent,
  createAuditEvent,
} from './primitives/AuditEvent';

export {
  type ValidationResult,
  validateEvidenceItem,
  validateEvidenceReport,
  calculateConfidenceScore,
} from './validators/evidenceValidator';

export {
  validateDecisionFrame,
  canTransition,
  validateStatusTransition,
} from './validators/decisionValidator';

export {
  type ConfidencePolicyResult,
  evaluateConfidencePolicy,
  canExecuteWithoutApproval,
  getConfidenceThresholds,
} from './policies/confidencePolicy';

export {
  type GovernanceCheck,
  checkApprovalRequirements,
  checkEvidenceRequirements,
  checkStatusTransition,
  enforceNoSilentExecution,
  runAllGovernanceChecks,
} from './policies/governancePolicy';

export {
  deterministicHash,
  hashSnapshot,
} from './audit/hash';

export {
  AppendOnlyLog,
  globalAuditLog,
} from './audit/appendOnlyLog';
