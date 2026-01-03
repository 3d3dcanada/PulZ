export type ModelLane = 'reasoning' | 'overnight_long_context' | 'fast_classification';

export interface ModelRoute {
  id: string;
  lane: ModelLane;
  label: string;
  description: string;
  primary_model: string;
  secondary_model: string;
  default_timeout_seconds: number;
  confidence_target: number;
  routing_rules: string[];
}

export const MODEL_ROUTES: ModelRoute[] = [
  {
    id: 'lane-reasoning',
    lane: 'reasoning',
    label: 'Reasoning & Synthesis',
    description: 'Primary lane for governance decisions and multi-step analysis.',
    primary_model: 'Llama-70B (local)',
    secondary_model: 'Claude 3.5 (remote)',
    default_timeout_seconds: 120,
    confidence_target: 85,
    routing_rules: [
      'Use for decision frames, governance summaries, and system planning.',
      'Require evidence_report_id before any action proposal.',
    ],
  },
  {
    id: 'lane-overnight',
    lane: 'overnight_long_context',
    label: 'Overnight Long-Context',
    description: 'Deep research lane for long-running synthesis and backlog digestion.',
    primary_model: 'Nemotron (batch)',
    secondary_model: 'Mistral Large (local)',
    default_timeout_seconds: 1800,
    confidence_target: 75,
    routing_rules: [
      'Use for backlog compression, narrative summaries, and trend detection.',
      'Only schedule in approved overnight windows.',
    ],
  },
  {
    id: 'lane-classification',
    lane: 'fast_classification',
    label: 'Fast Classification',
    description: 'Low-latency lane for tagging, routing, and signal triage.',
    primary_model: 'Gemma 2 (local)',
    secondary_model: 'GPT-4o mini (remote)',
    default_timeout_seconds: 15,
    confidence_target: 65,
    routing_rules: [
      'Use for intent classification, urgency tagging, and opportunity scoring.',
      'Never execute actions; only label and queue.',
    ],
  },
];

export function getModelRouteByLane(lane: ModelLane): ModelRoute | undefined {
  return MODEL_ROUTES.find((route) => route.lane === lane);
}
