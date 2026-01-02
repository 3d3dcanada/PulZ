import { AuditEvent, Actor, RelatedEntity } from '../primitives/AuditEvent';
import { hashSnapshot } from './hash';

export class AppendOnlyLog {
  private events: AuditEvent[] = [];
  private nextId = 1;

  append(params: {
    event_type: string;
    actor: Actor;
    related: RelatedEntity;
    snapshot_before: unknown;
    snapshot_after: unknown;
    notes?: string;
  }): AuditEvent {
    const before_hash = hashSnapshot(params.snapshot_before);
    const after_hash = hashSnapshot(params.snapshot_after);
    const previous_hash = this.getLastEventHash();

    const event: AuditEvent = {
      id: `audit-${this.nextId++}`,
      event_type: params.event_type,
      actor: params.actor,
      related: params.related,
      before_hash: previous_hash || before_hash,
      after_hash,
      timestamp: new Date().toISOString(),
      notes: params.notes,
    };

    this.events.push(event);
    return event;
  }

  getEvents(): readonly AuditEvent[] {
    return [...this.events];
  }

  getEventsByType(event_type: string): readonly AuditEvent[] {
    return this.events.filter(e => e.event_type === event_type);
  }

  getEventsByRelated(kind: string, id: string): readonly AuditEvent[] {
    return this.events.filter(e => e.related.kind === kind && e.related.id === id);
  }

  verifyChain(): boolean {
    if (this.events.length === 0) return true;

    for (let i = 1; i < this.events.length; i++) {
      const current = this.events[i];
      const previous = this.events[i - 1];
      
      if (current.before_hash !== previous.after_hash) {
        return false;
      }
    }
    return true;
  }

  private getLastEventHash(): string | null {
    if (this.events.length === 0) return null;
    return this.events[this.events.length - 1].after_hash;
  }

  getEventCount(): number {
    return this.events.length;
  }
}

export const globalAuditLog = new AppendOnlyLog();
