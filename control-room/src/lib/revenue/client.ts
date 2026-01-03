/**
 * PulZ Revenue System - Database Client Adapter
 * Phase D0 Hard Execution Mode
 *
 * Environment-gated persistence:
 * - If NEXT_PUBLIC_SUPABASE_URL exists → use Supabase
 * - Otherwise → use in-memory mock (for local development)
 *
 * This adapter provides a consistent API regardless of backend.
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
import { getPulzUserId } from '@/lib/pulz/user';
import {
  clearMockStoreSnapshot,
  loadMockStoreSnapshot,
  persistMockStoreSnapshot,
} from './storage';

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// ============================================================================
// IN-MEMORY MOCK STORE (for local development)
// ============================================================================

class MockStore {
  private opportunities: Map<string, Opportunity> = new Map();
  private drafts: Map<string, Draft> = new Map();
  private jobs: Map<string, Job> = new Map();
  private fulfillmentSteps: Map<string, FulfillmentStep> = new Map();
  private revenueEvents: Map<string, RevenueEvent> = new Map();
  private idCounter = 0;
  private userId: string | null = null;

  generateId(): string {
    return `mock-${Date.now()}-${++this.idCounter}`;
  }

  private ensureUserContext(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const currentUserId = getPulzUserId();
    if (this.userId === currentUserId) {
      return;
    }

    this.userId = currentUserId;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (!this.userId || typeof window === 'undefined') {
      return;
    }

    const snapshot = loadMockStoreSnapshot(this.userId);
    this.opportunities = new Map(snapshot.opportunities.map((item) => [item.id, item]));
    this.drafts = new Map(snapshot.drafts.map((item) => [item.id, item]));
    this.jobs = new Map(snapshot.jobs.map((item) => [item.id, item]));
    this.fulfillmentSteps = new Map(
      snapshot.fulfillmentSteps.map((item) => [item.id, item])
    );
    this.revenueEvents = new Map(
      snapshot.revenueEvents.map((item) => [item.id, item])
    );
    this.idCounter = snapshot.idCounter;
  }

  private persist(): void {
    if (!this.userId || typeof window === 'undefined') {
      return;
    }

    persistMockStoreSnapshot(this.userId, {
      opportunities: Array.from(this.opportunities.values()),
      drafts: Array.from(this.drafts.values()),
      jobs: Array.from(this.jobs.values()),
      fulfillmentSteps: Array.from(this.fulfillmentSteps.values()),
      revenueEvents: Array.from(this.revenueEvents.values()),
      idCounter: this.idCounter,
    });
  }

  reset(): void {
    this.ensureUserContext();
    this.opportunities.clear();
    this.drafts.clear();
    this.jobs.clear();
    this.fulfillmentSteps.clear();
    this.revenueEvents.clear();
    this.idCounter = 0;

    if (this.userId) {
      clearMockStoreSnapshot(this.userId);
    }
  }

  // Opportunities
  createOpportunity(input: CreateOpportunityInput): Opportunity {
    this.ensureUserContext();
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
      created_by: null,
      updated_by: null,
    };

    this.opportunities.set(id, opportunity);
    this.persist();
    return opportunity;
  }

  getOpportunity(id: string): Opportunity | null {
    this.ensureUserContext();
    return this.opportunities.get(id) ?? null;
  }

  listOpportunities(): Opportunity[] {
    this.ensureUserContext();
    return Array.from(this.opportunities.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Drafts
  createDraft(input: CreateDraftInput): Draft {
    this.ensureUserContext();
    const id = this.generateId();
    const now = new Date().toISOString();

    // Calculate version number
    const existingDrafts = Array.from(this.drafts.values()).filter(
      (d) => d.opportunity_id === input.opportunity_id
    );
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
      created_by: null,
      updated_by: null,
    };

    this.drafts.set(id, draft);
    this.persist();
    return draft;
  }

  getDraft(id: string): Draft | null {
    this.ensureUserContext();
    return this.drafts.get(id) ?? null;
  }

  listDraftsByOpportunity(opportunityId: string): Draft[] {
    this.ensureUserContext();
    return Array.from(this.drafts.values())
      .filter((d) => d.opportunity_id === opportunityId)
      .sort((a, b) => b.version - a.version);
  }

  approveDraft(input: ApproveDraftInput): Draft | null {
    this.ensureUserContext();
    const draft = this.drafts.get(input.draft_id);
    if (!draft) return null;

    if (draft.is_locked) {
      throw new Error(`Cannot approve locked draft (ID: ${input.draft_id})`);
    }

    const now = new Date().toISOString();
    const updated: Draft = {
      ...draft,
      is_approved: true,
      approved_at: now,
      approved_by: input.approved_by,
      is_locked: true,
      updated_at: now,
    };

    this.drafts.set(input.draft_id, updated);
    this.persist();
    return updated;
  }

  // Jobs
  createJob(input: CreateJobInput): Job {
    this.ensureUserContext();
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
      created_by: null,
      updated_by: null,
    };

    this.jobs.set(id, job);
    this.persist();
    return job;
  }

  getJob(id: string): Job | null {
    this.ensureUserContext();
    return this.jobs.get(id) ?? null;
  }

  listJobs(): Job[] {
    this.ensureUserContext();
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  updateJobStatus(input: UpdateJobStatusInput): Job | null {
    this.ensureUserContext();
    const job = this.jobs.get(input.job_id);
    if (!job) return null;

    const now = new Date().toISOString();
    const updated: Job = {
      ...job,
      status: input.status,
      updated_at: now,
      updated_by: input.updated_by,
    };

    // Set timestamps based on status
    if (input.status === 'printing' && !job.started_at) {
      updated.started_at = now;
    }
    if (input.status === 'paid' && !job.paid_at) {
      updated.paid_at = now;
    }
    if (input.status === 'shipped' && !job.completed_at) {
      updated.completed_at = now;
    }

    this.jobs.set(input.job_id, updated);
    this.persist();

    // Create fulfillment step
    this.createFulfillmentStep({
      job_id: input.job_id,
      from_status: job.status,
      to_status: input.status,
      notes: input.notes,
      created_by: input.updated_by,
    });

    return updated;
  }

  // Fulfillment Steps
  createFulfillmentStep(input: CreateFulfillmentStepInput): FulfillmentStep {
    this.ensureUserContext();
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

    this.fulfillmentSteps.set(id, step);
    this.persist();
    return step;
  }

  listFulfillmentStepsByJob(jobId: string): FulfillmentStep[] {
    this.ensureUserContext();
    return Array.from(this.fulfillmentSteps.values())
      .filter((s) => s.job_id === jobId)
      .sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }

  // Revenue Events
  createRevenueEvent(input: CreateRevenueEventInput): RevenueEvent {
    this.ensureUserContext();
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

    this.revenueEvents.set(id, event);
    this.persist();
    return event;
  }

  listRevenueEventsByJob(jobId: string): RevenueEvent[] {
    this.ensureUserContext();
    return Array.from(this.revenueEvents.values())
      .filter((e) => e.job_id === jobId)
      .sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
  }

  listAllRevenueEvents(): RevenueEvent[] {
    this.ensureUserContext();
    return Array.from(this.revenueEvents.values()).sort(
      (a, b) =>
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );
  }

  // Aggregate queries
  getOpportunityWithDrafts(id: string): OpportunityWithDrafts | null {
    this.ensureUserContext();
    const opportunity = this.getOpportunity(id);
    if (!opportunity) return null;

    return {
      ...opportunity,
      drafts: this.listDraftsByOpportunity(id),
    };
  }

  getJobWithDetails(id: string): JobWithDetails | null {
    this.ensureUserContext();
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
    this.ensureUserContext();
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

// Global mock store instance
const mockStore = new MockStore();

// ============================================================================
// SUPABASE CLIENT (placeholder - will be implemented when credentials exist)
// ============================================================================

class SupabaseClient {
  // TODO: Implement real Supabase client when credentials are configured
  // For now, this throws to ensure we don't silently fail

  async createOpportunity(_input: CreateOpportunityInput): Promise<Opportunity> {
    throw new Error('Supabase client not yet implemented');
  }

  async getOpportunity(_id: string): Promise<Opportunity | null> {
    throw new Error('Supabase client not yet implemented');
  }

  async listOpportunities(): Promise<Opportunity[]> {
    throw new Error('Supabase client not yet implemented');
  }

  async createDraft(_input: CreateDraftInput): Promise<Draft> {
    throw new Error('Supabase client not yet implemented');
  }

  async getDraft(_id: string): Promise<Draft | null> {
    throw new Error('Supabase client not yet implemented');
  }

  async listDraftsByOpportunity(_opportunityId: string): Promise<Draft[]> {
    throw new Error('Supabase client not yet implemented');
  }

  async approveDraft(_input: ApproveDraftInput): Promise<Draft | null> {
    throw new Error('Supabase client not yet implemented');
  }

  async createJob(_input: CreateJobInput): Promise<Job> {
    throw new Error('Supabase client not yet implemented');
  }

  async getJob(_id: string): Promise<Job | null> {
    throw new Error('Supabase client not yet implemented');
  }

  async listJobs(): Promise<Job[]> {
    throw new Error('Supabase client not yet implemented');
  }

  async updateJobStatus(_input: UpdateJobStatusInput): Promise<Job | null> {
    throw new Error('Supabase client not yet implemented');
  }

  async createFulfillmentStep(_input: CreateFulfillmentStepInput): Promise<FulfillmentStep> {
    throw new Error('Supabase client not yet implemented');
  }

  async listFulfillmentStepsByJob(_jobId: string): Promise<FulfillmentStep[]> {
    throw new Error('Supabase client not yet implemented');
  }

  async createRevenueEvent(_input: CreateRevenueEventInput): Promise<RevenueEvent> {
    throw new Error('Supabase client not yet implemented');
  }

  async listRevenueEventsByJob(_jobId: string): Promise<RevenueEvent[]> {
    throw new Error('Supabase client not yet implemented');
  }

  async listAllRevenueEvents(): Promise<RevenueEvent[]> {
    throw new Error('Supabase client not yet implemented');
  }

  async getOpportunityWithDrafts(_id: string): Promise<OpportunityWithDrafts | null> {
    throw new Error('Supabase client not yet implemented');
  }

  async getJobWithDetails(_id: string): Promise<JobWithDetails | null> {
    throw new Error('Supabase client not yet implemented');
  }

  async getRevenueSummary(): Promise<RevenueSummary> {
    throw new Error('Supabase client not yet implemented');
  }
}

const supabaseClient = new SupabaseClient();

// ============================================================================
// UNIFIED API (environment-gated)
// ============================================================================

export const revenueApi = {
  // Configuration
  isUsingSupabase: USE_SUPABASE,
  backendType: USE_SUPABASE ? 'supabase' : 'mock',

  // Opportunities
  createOpportunity: async (input: CreateOpportunityInput): Promise<Opportunity> => {
    if (USE_SUPABASE) {
      return await supabaseClient.createOpportunity(input);
    }
    return mockStore.createOpportunity(input);
  },

  getOpportunity: async (id: string): Promise<Opportunity | null> => {
    if (USE_SUPABASE) {
      return await supabaseClient.getOpportunity(id);
    }
    return mockStore.getOpportunity(id);
  },

  listOpportunities: async (): Promise<Opportunity[]> => {
    if (USE_SUPABASE) {
      return await supabaseClient.listOpportunities();
    }
    return mockStore.listOpportunities();
  },

  // Drafts
  createDraft: async (input: CreateDraftInput): Promise<Draft> => {
    if (USE_SUPABASE) {
      return await supabaseClient.createDraft(input);
    }
    return mockStore.createDraft(input);
  },

  getDraft: async (id: string): Promise<Draft | null> => {
    if (USE_SUPABASE) {
      return await supabaseClient.getDraft(id);
    }
    return mockStore.getDraft(id);
  },

  listDraftsByOpportunity: async (opportunityId: string): Promise<Draft[]> => {
    if (USE_SUPABASE) {
      return await supabaseClient.listDraftsByOpportunity(opportunityId);
    }
    return mockStore.listDraftsByOpportunity(opportunityId);
  },

  approveDraft: async (input: ApproveDraftInput): Promise<Draft | null> => {
    if (USE_SUPABASE) {
      return await supabaseClient.approveDraft(input);
    }
    return mockStore.approveDraft(input);
  },

  // Jobs
  createJob: async (input: CreateJobInput): Promise<Job> => {
    if (USE_SUPABASE) {
      return await supabaseClient.createJob(input);
    }
    return mockStore.createJob(input);
  },

  getJob: async (id: string): Promise<Job | null> => {
    if (USE_SUPABASE) {
      return await supabaseClient.getJob(id);
    }
    return mockStore.getJob(id);
  },

  listJobs: async (): Promise<Job[]> => {
    if (USE_SUPABASE) {
      return await supabaseClient.listJobs();
    }
    return mockStore.listJobs();
  },

  updateJobStatus: async (input: UpdateJobStatusInput): Promise<Job | null> => {
    if (USE_SUPABASE) {
      return await supabaseClient.updateJobStatus(input);
    }
    return mockStore.updateJobStatus(input);
  },

  // Fulfillment Steps
  createFulfillmentStep: async (input: CreateFulfillmentStepInput): Promise<FulfillmentStep> => {
    if (USE_SUPABASE) {
      return await supabaseClient.createFulfillmentStep(input);
    }
    return mockStore.createFulfillmentStep(input);
  },

  listFulfillmentStepsByJob: async (jobId: string): Promise<FulfillmentStep[]> => {
    if (USE_SUPABASE) {
      return await supabaseClient.listFulfillmentStepsByJob(jobId);
    }
    return mockStore.listFulfillmentStepsByJob(jobId);
  },

  // Revenue Events
  createRevenueEvent: async (input: CreateRevenueEventInput): Promise<RevenueEvent> => {
    if (USE_SUPABASE) {
      return await supabaseClient.createRevenueEvent(input);
    }
    return mockStore.createRevenueEvent(input);
  },

  listRevenueEventsByJob: async (jobId: string): Promise<RevenueEvent[]> => {
    if (USE_SUPABASE) {
      return await supabaseClient.listRevenueEventsByJob(jobId);
    }
    return mockStore.listRevenueEventsByJob(jobId);
  },

  listAllRevenueEvents: async (): Promise<RevenueEvent[]> => {
    if (USE_SUPABASE) {
      return await supabaseClient.listAllRevenueEvents();
    }
    return mockStore.listAllRevenueEvents();
  },

  // Aggregate queries
  getOpportunityWithDrafts: async (id: string): Promise<OpportunityWithDrafts | null> => {
    if (USE_SUPABASE) {
      return await supabaseClient.getOpportunityWithDrafts(id);
    }
    return mockStore.getOpportunityWithDrafts(id);
  },

  getJobWithDetails: async (id: string): Promise<JobWithDetails | null> => {
    if (USE_SUPABASE) {
      return await supabaseClient.getJobWithDetails(id);
    }
    return mockStore.getJobWithDetails(id);
  },

  getRevenueSummary: async (): Promise<RevenueSummary> => {
    if (USE_SUPABASE) {
      return await supabaseClient.getRevenueSummary();
    }
    return mockStore.getRevenueSummary();
  },

  resetLocalData: (): void => {
    if (!USE_SUPABASE) {
      mockStore.reset();
    }
  },
};
