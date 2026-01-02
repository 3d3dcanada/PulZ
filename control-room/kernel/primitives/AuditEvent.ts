export type ActorType = 'human' | 'system' | 'model';

export interface Actor {
  type: ActorType;
  id?: string;
}

export interface RelatedEntity {
  kind: string;
  id: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  actor: Actor;
  related: RelatedEntity;
  before_hash: string;
  after_hash: string;
  timestamp: string;
  notes?: string;
}

export function createAuditEvent(params: {
  id: string;
  event_type: string;
  actor: Actor;
  related: RelatedEntity;
  before_hash: string;
  after_hash: string;
  notes?: string;
}): AuditEvent {
  return {
    ...params,
    timestamp: new Date().toISOString(),
  };
}
