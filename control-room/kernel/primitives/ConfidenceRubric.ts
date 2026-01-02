export type ActionClass = 'blocked' | 'approval_required_reversible' | 'automation_eligible';

export interface ConfidenceLevel {
  min: number;
  max: number;
  action_class: ActionClass;
  description: string;
}

export const CONFIDENCE_RUBRIC: ConfidenceLevel[] = [
  {
    min: 0,
    max: 49,
    action_class: 'blocked',
    description: 'Insufficient confidence - action blocked',
  },
  {
    min: 50,
    max: 69,
    action_class: 'approval_required_reversible',
    description: 'Moderate confidence - approval required, reversible only',
  },
  {
    min: 70,
    max: 89,
    action_class: 'approval_required_reversible',
    description: 'High confidence - approval required, reversible only',
  },
  {
    min: 90,
    max: 100,
    action_class: 'automation_eligible',
    description: 'Very high confidence - automation eligible if explicitly enabled',
  },
];

export function getActionClass(confidenceScore: number): ActionClass {
  for (const level of CONFIDENCE_RUBRIC) {
    if (confidenceScore >= level.min && confidenceScore <= level.max) {
      return level.action_class;
    }
  }
  return 'blocked';
}

export function getAllowedActions(confidenceScore: number): string[] {
  const actionClass = getActionClass(confidenceScore);
  
  switch (actionClass) {
    case 'blocked':
      return [];
    case 'approval_required_reversible':
      return ['review', 'approve_with_supervision', 'reject'];
    case 'automation_eligible':
      return ['review', 'approve_with_supervision', 'approve_for_automation', 'reject'];
    default:
      return [];
  }
}

export function getBlockedActions(confidenceScore: number): string[] {
  const actionClass = getActionClass(confidenceScore);
  
  switch (actionClass) {
    case 'blocked':
      return ['execute', 'approve', 'automate'];
    case 'approval_required_reversible':
      return ['execute_without_approval', 'automate'];
    case 'automation_eligible':
      return ['execute_without_approval'];
    default:
      return ['execute', 'approve', 'automate'];
  }
}

export function getRiskLevel(confidenceScore: number): 'low' | 'medium' | 'high' {
  if (confidenceScore >= 80) return 'low';
  if (confidenceScore >= 60) return 'medium';
  return 'high';
}
