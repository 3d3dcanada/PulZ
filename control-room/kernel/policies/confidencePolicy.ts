import { 
  getActionClass, 
  getAllowedActions, 
  getBlockedActions, 
  getRiskLevel,
  ActionClass,
  CONFIDENCE_RUBRIC 
} from '../primitives/ConfidenceRubric';

export interface ConfidencePolicyResult {
  score: number;
  action_class: ActionClass;
  risk_level: 'low' | 'medium' | 'high';
  allowed_actions: string[];
  blocked_actions: string[];
  requires_approval: boolean;
  can_automate: boolean;
  reasoning: string;
}

export function evaluateConfidencePolicy(confidenceScore: number): ConfidencePolicyResult {
  const action_class = getActionClass(confidenceScore);
  const risk_level = getRiskLevel(confidenceScore);
  const allowed_actions = getAllowedActions(confidenceScore);
  const blocked_actions = getBlockedActions(confidenceScore);
  
  const requires_approval = action_class !== 'blocked';
  const can_automate = action_class === 'automation_eligible';

  let reasoning = '';
  if (confidenceScore < 50) {
    reasoning = 'Confidence too low - all actions blocked until evidence improved';
  } else if (confidenceScore < 70) {
    reasoning = 'Moderate confidence - human approval required, only reversible actions permitted';
  } else if (confidenceScore < 90) {
    reasoning = 'High confidence - human approval required, only reversible actions permitted';
  } else {
    reasoning = 'Very high confidence - automation eligible if explicitly enabled by governance';
  }

  return {
    score: confidenceScore,
    action_class,
    risk_level,
    allowed_actions,
    blocked_actions,
    requires_approval,
    can_automate,
    reasoning,
  };
}

export function canExecuteWithoutApproval(confidenceScore: number): boolean {
  return false;
}

export function getConfidenceThresholds() {
  return CONFIDENCE_RUBRIC;
}
