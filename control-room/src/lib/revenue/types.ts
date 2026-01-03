/**
 * PulZ Revenue System - TypeScript Models
 * Phase D0 Hard Execution Mode
 *
 * These types mirror the Supabase schema in supabase/migrations/001_initial_schema.sql
 * All fields must match the database schema exactly.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ServiceType = 'physical' | 'software';

export type OpportunityStatus =
  | 'new'
  | 'reviewing'
  | 'drafting'
  | 'approved'
  | 'declined'
  | 'completed';

export type JobStatus =
  | 'approved'
  | 'printing'
  | 'post_processing'
  | 'packed'
  | 'shipped'
  | 'paid';

// ============================================================================
// OPPORTUNITY
// ============================================================================

export interface Opportunity {
  // Primary key
  id: string;

  // Core fields
  service_type: ServiceType;
  status: OpportunityStatus;

  // Contact information
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_company: string | null;

  // Opportunity details
  title: string;
  description: string;

  // Physical service fields (nullable for software services)
  material_type: string | null;
  quantity: number | null;
  dimensions: string | null;
  file_url: string | null;

  // Software service fields (nullable for physical services)
  scope_description: string | null;
  estimated_hours: number | null;
  required_skills: string[] | null;
  delivery_deadline: string | null; // ISO 8601 timestamp

  // Financial
  estimated_value: number | null;
  currency: string;

  // Metadata
  source: string | null; // e.g., "website", "email", "referral", "tender"
  priority: number;
  notes: string | null;

  // Timestamps
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  completed_at: string | null; // ISO 8601 timestamp

  // Audit
  created_by: string | null;
  updated_by: string | null;
}

export interface CreateOpportunityInput {
  service_type: ServiceType;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_company?: string;
  title: string;
  description: string;

  // Physical service fields
  material_type?: string;
  quantity?: number;
  dimensions?: string;
  file_url?: string;

  // Software service fields
  scope_description?: string;
  estimated_hours?: number;
  required_skills?: string[];
  delivery_deadline?: string;

  // Financial
  estimated_value?: number;
  currency?: string;

  // Metadata
  source?: string;
  priority?: number;
  notes?: string;
}

// ============================================================================
// DRAFT
// ============================================================================

export interface PricingBreakdown {
  [key: string]: number;
  // Example: { "materials": 100, "labor": 200, "shipping": 50 }
}

export interface Draft {
  // Primary key
  id: string;
  opportunity_id: string;

  // Draft content
  version: number;
  title: string;
  content: string;

  // Pricing breakdown
  pricing_breakdown: PricingBreakdown | null;
  total_price: number;
  currency: string;

  // Approval state
  is_approved: boolean;
  approved_at: string | null; // ISO 8601 timestamp
  approved_by: string | null;

  // Immutability enforcement
  is_locked: boolean;

  // Metadata
  notes: string | null;

  // Timestamps
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp

  // Audit
  created_by: string | null;
  updated_by: string | null;
}

export interface CreateDraftInput {
  opportunity_id: string;
  title: string;
  content: string;
  pricing_breakdown?: PricingBreakdown;
  total_price: number;
  currency?: string;
  notes?: string;
}

export interface ApproveDraftInput {
  draft_id: string;
  approved_by: string;
}

// ============================================================================
// JOB
// ============================================================================

export interface Job {
  // Primary key
  id: string;
  opportunity_id: string;
  draft_id: string;

  // Job identification
  job_number: string; // e.g., "JOB-2026-001"
  service_type: ServiceType;
  status: JobStatus;

  // Job details
  title: string;
  description: string | null;

  // Physical job fields
  print_duration_hours: number | null;
  material_used_grams: number | null;
  post_processing_notes: string | null;

  // Software job fields
  scope_delivered: string | null;
  hours_logged: number | null;
  deliverables_url: string | null;

  // Financial
  agreed_price: number;
  currency: string;

  // Timestamps
  started_at: string | null; // ISO 8601 timestamp
  completed_at: string | null; // ISO 8601 timestamp
  paid_at: string | null; // ISO 8601 timestamp

  // Metadata
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp

  // Audit
  created_by: string | null;
  updated_by: string | null;
}

export interface CreateJobInput {
  opportunity_id: string;
  draft_id: string;
  job_number: string;
  service_type: ServiceType;
  title: string;
  description?: string;
  agreed_price: number;
  currency?: string;
}

export interface UpdateJobStatusInput {
  job_id: string;
  status: JobStatus;
  updated_by: string;
  notes?: string;
}

// ============================================================================
// FULFILLMENT STEP
// ============================================================================

export interface FulfillmentStep {
  // Primary key
  id: string;
  job_id: string;

  // State transition
  from_status: JobStatus | null;
  to_status: JobStatus;

  // Evidence
  notes: string | null;
  attachments: Record<string, unknown> | null; // JSONB - URLs or references to files

  // Timestamps
  created_at: string; // ISO 8601 timestamp

  // Audit
  created_by: string;
}

export interface CreateFulfillmentStepInput {
  job_id: string;
  from_status: JobStatus | null;
  to_status: JobStatus;
  notes?: string;
  attachments?: Record<string, unknown>;
  created_by: string;
}

// ============================================================================
// REVENUE EVENT
// ============================================================================

export type RevenueEventType =
  | 'invoice_sent'
  | 'payment_received'
  | 'refund_issued'
  | 'discount_applied'
  | 'late_fee_added';

export interface RevenueEvent {
  // Primary key
  id: string;
  job_id: string;

  // Event details
  event_type: string; // RevenueEventType or custom
  amount: number;
  currency: string;

  // Payment details
  payment_method: string | null; // e.g., "interac", "credit_card", "wire_transfer"
  transaction_id: string | null;

  // Metadata
  notes: string | null;

  // Timestamps
  event_date: string; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp

  // Audit
  created_by: string;
}

export interface CreateRevenueEventInput {
  job_id: string;
  event_type: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  event_date?: string; // ISO 8601 timestamp, defaults to now
  created_by: string;
}

// ============================================================================
// AGGREGATE TYPES (for UI views)
// ============================================================================

export interface OpportunityWithDrafts extends Opportunity {
  drafts: Draft[];
}

export interface JobWithDetails extends Job {
  opportunity: Opportunity;
  draft: Draft;
  fulfillment_steps: FulfillmentStep[];
  revenue_events: RevenueEvent[];
}

export interface RevenueSummary {
  total_revenue: number;
  total_jobs: number;
  jobs_by_status: Record<JobStatus, number>;
  revenue_by_service_type: Record<ServiceType, number>;
  currency: string;
}

// ============================================================================
// VALIDATION SCHEMAS (lightweight runtime validation)
// ============================================================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateOpportunityInput(input: CreateOpportunityInput): string[] {
  const errors: string[] = [];

  if (!input.contact_name.trim()) {
    errors.push('Contact name is required');
  }

  if (!input.contact_email.trim()) {
    errors.push('Contact email is required');
  } else if (!EMAIL_REGEX.test(input.contact_email)) {
    errors.push('Contact email is invalid');
  }

  if (!input.title.trim()) {
    errors.push('Title is required');
  }

  if (!input.description.trim()) {
    errors.push('Description is required');
  }

  // Service-type-specific validation
  if (input.service_type === 'physical') {
    if (!input.material_type) {
      errors.push('Material type is required for physical services');
    }
    if (!input.quantity || input.quantity <= 0) {
      errors.push('Quantity must be greater than 0 for physical services');
    }
  }

  if (input.service_type === 'software') {
    if (!input.scope_description) {
      errors.push('Scope description is required for software services');
    }
  }

  return errors;
}

export function validateDraftInput(input: CreateDraftInput): string[] {
  const errors: string[] = [];

  if (!input.title.trim()) {
    errors.push('Title is required');
  }

  if (!input.content.trim()) {
    errors.push('Content is required');
  }

  if (input.total_price <= 0) {
    errors.push('Total price must be greater than 0');
  }

  return errors;
}
