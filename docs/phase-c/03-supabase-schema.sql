-- PulZ Phase C schema scaffolding (non-executing)

create type action_class as enum ('A', 'B', 'C');
create type approval_state as enum (
  'log_only',
  'drafted',
  'awaiting_single_approval',
  'awaiting_multi_gate',
  'approved',
  'blocked',
  'rejected'
);
create type evidence_tier as enum ('tier_1', 'tier_2', 'tier_3');

create table opportunities (
  id uuid primary key,
  title text not null,
  summary text,
  relevance_score numeric not null default 0,
  urgency_window text,
  reversibility text,
  profit_potential text,
  confidence_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table evidence_reports (
  id uuid primary key,
  evidence_tier evidence_tier not null,
  confidence_score numeric not null,
  coverage_summary text not null,
  limitations text[] not null default '{}',
  assumptions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table decision_frames (
  id uuid primary key,
  objective text not null,
  recommendation text not null,
  evidence_report_id uuid references evidence_reports(id),
  evidence_tier evidence_tier not null,
  confidence_score numeric not null,
  action_class action_class not null,
  approval_state approval_state not null,
  approval_required boolean not null default true,
  status text not null,
  approver_id uuid,
  approval_timestamp timestamptz,
  created_at timestamptz not null default now()
);

create table audit_events (
  id uuid primary key,
  event_type text not null,
  actor_type text not null,
  actor_id uuid,
  related_kind text not null,
  related_id uuid not null,
  hash text not null,
  previous_hash text,
  created_at timestamptz not null default now()
);

create table learning_outcomes (
  id uuid primary key,
  headline text not null,
  takeaway text not null,
  created_at timestamptz not null default now()
);

-- RLS notes (non-executing):
-- - opportunities: read-only for operators, insert via ingestion pipeline.
-- - decision_frames: insert/update only via kernel service role.
-- - audit_events: append-only with no update permissions.
-- - evidence_reports: insert only, no updates.
