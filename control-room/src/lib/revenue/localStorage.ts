/**
 * PulZ Local Storage Persistence Adapter
 * Phase D0 Hard Execution Mode
 *
 * Persistent storage using browser localStorage.
 * Data survives page refreshes until browser storage is cleared.
 *
 * This adapter implements the same interface as the Supabase client,
 * making it easy to swap persistence layers later.
 */

import {
  Opportunity,
  CreateOpportunityInput,
  Draft,
  CreateDraftInput,
  ApproveDraftInput,
  Job,
  CreateJobInput,
  UpdateJobStatusInput,
  FulfillmentStep,
  CreateFulfillmentStepInput,
  RevenueEvent,
  CreateRevenueEventInput,
  OpportunityWithDrafts,
  JobWithDetails,
  RevenueSummary,
  JobStatus,
  ServiceType,
} from './types';

const STORAGE_KEYS = {
  OPPORTUNITIES: 'pulz_opportunities',
  DRAFTS: 'pulz_drafts',
  JOBS: 'pulz_jobs',
  FULFILLMENT_STEPS: 'pulz_fulfillment_steps',
  REVENUE_EVENTS: 'pulz_revenue_events',
  ACTIVITY_EVENTS: 'pulz_activity_events',
} as const;

export interface ActivityEvent {
  id: string;
  type: 'opportunity_created' | 'draft_created' | 'draft_approved' | 'job_created' | 'status_changed' | 'revenue_logged';
  user_id: string;
  user_name: string;
  description: string;
  entity_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class LocalStorageAdapter {
  private idCounter = 0;

  constructor() {
    this.idCounter = Date.now();
  }

  private generateId(): string {
    return `local-${Date.now()}-${++this.idCounter}`;
  }

  private load<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return [];
    }
  }

  private save<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }

  private logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
    const events = this.load<ActivityEvent>(STORAGE_KEYS.ACTIVITY_EVENTS);
    const newEvent: ActivityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };
    events.unshift(newEvent); // Newest first
    // Keep only last 100 events
    if (events.length > 100) events.length = 100;
    this.save(STORAGE_KEYS.ACTIVITY_EVENTS, events);
  }

  // Activity Events
  listActivityEvents(): ActivityEvent[] {
    return this.load<ActivityEvent>(STORAGE_KEYS.ACTIVITY_EVENTS);
  }

  // Opportunities
  createOpportunity(input: CreateOpportunityInput, user: { id: string; display_name: string }): Opportunity {
    const id = this.generateId();
    const now = new Date().toISOString();

    const opportunity: Opportunity = {
      id,
      service_type: input.service_type,
      status: 'new',
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone ?? null,
      contact_company: input.contact_company ?? null,
      title: input.title,
      description: input.description,
      material_type: input.material_type ?? null,
      quantity: input.quantity ?? null,
      dimensions: input.dimensions ?? null,
      file_url: input.file_url ?? null,
      scope_description: input.scope_description ?? null,
      estimated_hours: input.estimated_hours ?? null,
      required_skills: input.required_skills ?? null,
      delivery_deadline: input.delivery_deadline ?? null,
      estimated_value: input.estimated_value ?? null,
      currency: input.currency ?? 'CAD',
      source: input.source ?? null,
      priority: input.priority ?? 0,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
      completed_at: null,
      created_by: user.id,
      updated_by: null,
    };

    const opportunities = this.load<Opportunity>(STORAGE_KEYS.OPPORTUNITIES);
    opportunities.push(opportunity);
    this.save(STORAGE_KEYS.OPPORTUNITIES, opportunities);

    this.logActivity({
      type: 'opportunity_created',
      user_id: user.id,
      user_name: user.display_name,
      description: `Created opportunity: ${input.title}`,
      entity_id: id,
      metadata: { service_type: input.service_type },
    });

    return opportunity;
  }

  getOpportunity(id: string): Opportunity | null {
    const opportunities = this.load<Opportunity>(STORAGE_KEYS.OPPORTUNITIES);
    return opportunities.find((o) => o.id === id) ?? null;
  }

  listOpportunities(): Opportunity[] {
    return this.load<Opportunity>(STORAGE_KEYS.OPPORTUNITIES).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Drafts
  createDraft(input: CreateDraftInput, user: { id: string; display_name: string }): Draft {
    const id = this.generateId();
    const now = new Date().toISOString();

    const drafts = this.load<Draft>(STORAGE_KEYS.DRAFTS);
    const existingDrafts = drafts.filter((d) => d.opportunity_id === input.opportunity_id);
    const version = existingDrafts.length + 1;

    const draft: Draft = {
      id,
      opportunity_id: input.opportunity_id,
      version,
      title: input.title,
      content: input.content,
      pricing_breakdown: input.pricing_breakdown ?? null,
      total_price: input.total_price,
      currency: input.currency ?? 'CAD',
      is_approved: false,
      approved_at: null,
      approved_by: null,
      is_locked: false,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: null,
    };

    drafts.push(draft);
    this.save(STORAGE_KEYS.DRAFTS, drafts);

    this.logActivity({
      type: 'draft_created',
      user_id: user.id,
      user_name: user.display_name,
      description: `Created draft v${version}: ${input.title}`,
      entity_id: id,
    });

    return draft;
  }

  getDraft(id: string): Draft | null {
    const drafts = this.load<Draft>(STORAGE_KEYS.DRAFTS);
    return drafts.find((d) => d.id === id) ?? null;
  }

  listDraftsByOpportunity(opportunityId: string): Draft[] {
    return this.load<Draft>(STORAGE_KEYS.DRAFTS)
      .filter((d) => d.opportunity_id === opportunityId)
      .sort((a, b) => b.version - a.version);
  }

  approveDraft(input: ApproveDraftInput, user: { id: string; display_name: string }): Draft | null {
    const drafts = this.load<Draft>(STORAGE_KEYS.DRAFTS);
    const draft = drafts.find((d) => d.id === input.draft_id);

    if (!draft) return null;
    if (draft.is_locked) {
      throw new Error(`Cannot approve locked draft (ID: ${input.draft_id})`);
    }

    const now = new Date().toISOString();
    draft.is_approved = true;
    draft.approved_at = now;
    draft.approved_by = input.approved_by;
    draft.is_locked = true;
    draft.updated_at = now;

    this.save(STORAGE_KEYS.DRAFTS, drafts);

    this.logActivity({
      type: 'draft_approved',
      user_id: user.id,
      user_name: user.display_name,
      description: `Approved draft: ${draft.title}`,
      entity_id: input.draft_id,
    });

    return draft;
  }

  // Jobs
  createJob(input: CreateJobInput, user: { id: string; display_name: string }): Job {
    const id = this.generateId();
    const now = new Date().toISOString();

    const job: Job = {
      id,
      opportunity_id: input.opportunity_id,
      draft_id: input.draft_id,
      job_number: input.job_number,
      service_type: input.service_type,
      status: 'approved',
      title: input.title,
      description: input.description ?? null,
      print_duration_hours: null,
      material_used_grams: null,
      post_processing_notes: null,
      scope_delivered: null,
      hours_logged: null,
      deliverables_url: null,
      agreed_price: input.agreed_price,
      currency: input.currency ?? 'CAD',
      started_at: null,
      completed_at: null,
      paid_at: null,
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: null,
    };

    const jobs = this.load<Job>(STORAGE_KEYS.JOBS);
    jobs.push(job);
    this.save(STORAGE_KEYS.JOBS, jobs);

    this.logActivity({
      type: 'job_created',
      user_id: user.id,
      user_name: user.display_name,
      description: `Created job: ${input.job_number}`,
      entity_id: id,
      metadata: { service_type: input.service_type },
    });

    return job;
  }

  getJob(id: string): Job | null {
    const jobs = this.load<Job>(STORAGE_KEYS.JOBS);
    return jobs.find((j) => j.id === id) ?? null;
  }

  listJobs(): Job[] {
    return this.load<Job>(STORAGE_KEYS.JOBS).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  updateJobStatus(input: UpdateJobStatusInput, user: { id: string; display_name: string }): Job | null {
    const jobs = this.load<Job>(STORAGE_KEYS.JOBS);
    const job = jobs.find((j) => j.id === input.job_id);

    if (!job) return null;

    const now = new Date().toISOString();
    const oldStatus = job.status;
    job.status = input.status;
    job.updated_at = now;
    job.updated_by = input.updated_by;

    // Set timestamps based on status
    if (input.status === 'printing' && !job.started_at) {
      job.started_at = now;
    }
    if (input.status === 'paid' && !job.paid_at) {
      job.paid_at = now;
    }
    if (input.status === 'shipped' && !job.completed_at) {
      job.completed_at = now;
    }

    this.save(STORAGE_KEYS.JOBS, jobs);

    // Create fulfillment step
    this.createFulfillmentStep({
      job_id: input.job_id,
      from_status: oldStatus,
      to_status: input.status,
      notes: input.notes,
      created_by: input.updated_by,
    }, user);

    this.logActivity({
      type: 'status_changed',
      user_id: user.id,
      user_name: user.display_name,
      description: `Changed ${job.job_number} status: ${oldStatus} → ${input.status}`,
      entity_id: input.job_id,
      metadata: { from: oldStatus, to: input.status },
    });

    return job;
  }

  // Fulfillment Steps
  createFulfillmentStep(input: CreateFulfillmentStepInput, user: { id: string; display_name: string }): FulfillmentStep {
    const id = this.generateId();
    const now = new Date().toISOString();

    const step: FulfillmentStep = {
      id,
      job_id: input.job_id,
      from_status: input.from_status,
      to_status: input.to_status,
      notes: input.notes ?? null,
      attachments: input.attachments ?? null,
      created_at: now,
      created_by: input.created_by,
    };

    const steps = this.load<FulfillmentStep>(STORAGE_KEYS.FULFILLMENT_STEPS);
    steps.push(step);
    this.save(STORAGE_KEYS.FULFILLMENT_STEPS, steps);

    return step;
  }

  listFulfillmentStepsByJob(jobId: string): FulfillmentStep[] {
    return this.load<FulfillmentStep>(STORAGE_KEYS.FULFILLMENT_STEPS)
      .filter((s) => s.job_id === jobId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // Revenue Events
  createRevenueEvent(input: CreateRevenueEventInput, user: { id: string; display_name: string }): RevenueEvent {
    const id = this.generateId();
    const now = new Date().toISOString();

    const event: RevenueEvent = {
      id,
      job_id: input.job_id,
      event_type: input.event_type,
      amount: input.amount,
      currency: input.currency ?? 'CAD',
      payment_method: input.payment_method ?? null,
      transaction_id: input.transaction_id ?? null,
      notes: input.notes ?? null,
      event_date: input.event_date ?? now,
      created_at: now,
      created_by: input.created_by,
    };

    const events = this.load<RevenueEvent>(STORAGE_KEYS.REVENUE_EVENTS);
    events.push(event);
    this.save(STORAGE_KEYS.REVENUE_EVENTS, events);

    const job = this.getJob(input.job_id);
    this.logActivity({
      type: 'revenue_logged',
      user_id: user.id,
      user_name: user.display_name,
      description: `Logged ${input.event_type}: $${input.amount} (${job?.job_number || 'Unknown'})`,
      entity_id: id,
      metadata: { event_type: input.event_type, amount: input.amount },
    });

    return event;
  }

  listRevenueEventsByJob(jobId: string): RevenueEvent[] {
    return this.load<RevenueEvent>(STORAGE_KEYS.REVENUE_EVENTS)
      .filter((e) => e.job_id === jobId)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }

  listAllRevenueEvents(): RevenueEvent[] {
    return this.load<RevenueEvent>(STORAGE_KEYS.REVENUE_EVENTS).sort(
      (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );
  }

  // Aggregate queries
  getOpportunityWithDrafts(id: string): OpportunityWithDrafts | null {
    const opportunity = this.getOpportunity(id);
    if (!opportunity) return null;

    return {
      ...opportunity,
      drafts: this.listDraftsByOpportunity(id),
    };
  }

  getJobWithDetails(id: string): JobWithDetails | null {
    const job = this.getJob(id);
    if (!job) return null;

    const opportunity = this.getOpportunity(job.opportunity_id);
    const draft = this.getDraft(job.draft_id);

    if (!opportunity || !draft) return null;

    return {
      ...job,
      opportunity,
      draft,
      fulfillment_steps: this.listFulfillmentStepsByJob(id),
      revenue_events: this.listRevenueEventsByJob(id),
    };
  }

  getRevenueSummary(): RevenueSummary {
    const jobs = this.listJobs();
    const revenueEvents = this.listAllRevenueEvents();

    const total_revenue = revenueEvents
      .filter((e) => e.event_type === 'payment_received')
      .reduce((sum, e) => sum + e.amount, 0);

    const jobs_by_status: Record<JobStatus, number> = {
      approved: 0,
      printing: 0,
      post_processing: 0,
      packed: 0,
      shipped: 0,
      paid: 0,
    };

    const revenue_by_service_type: Record<ServiceType, number> = {
      physical: 0,
      software: 0,
    };

    jobs.forEach((job) => {
      jobs_by_status[job.status] = (jobs_by_status[job.status] || 0) + 1;

      if (job.status === 'paid') {
        revenue_by_service_type[job.service_type] += job.agreed_price;
      }
    });

    return {
      total_revenue,
      total_jobs: jobs.length,
      jobs_by_status,
      revenue_by_service_type,
      currency: 'CAD',
    };
  }
}
