-- PulZ Revenue System Schema
-- Phase D0 Hard Execution Mode
-- Created: 2026-01-03

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service types enum
CREATE TYPE service_type AS ENUM ('physical', 'software');

-- Opportunity status enum
CREATE TYPE opportunity_status AS ENUM ('new', 'reviewing', 'drafting', 'approved', 'declined', 'completed');

-- Job status enum
CREATE TYPE job_status AS ENUM ('approved', 'printing', 'post_processing', 'packed', 'shipped', 'paid');

-- ============================================================================
-- OPPORTUNITIES TABLE
-- Stores incoming leads and inquiries
-- ============================================================================
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core fields
    service_type service_type NOT NULL,
    status opportunity_status NOT NULL DEFAULT 'new',

    -- Contact information
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_company TEXT,

    -- Opportunity details
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Physical service fields (nullable for software services)
    material_type TEXT,
    quantity INTEGER,
    dimensions TEXT,
    file_url TEXT,

    -- Software service fields (nullable for physical services)
    scope_description TEXT,
    estimated_hours DECIMAL(10,2),
    required_skills TEXT[],
    delivery_deadline TIMESTAMP WITH TIME ZONE,

    -- Financial
    estimated_value DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'CAD',

    -- Metadata
    source TEXT, -- e.g., "website", "email", "referral", "tender"
    priority INTEGER DEFAULT 0,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by TEXT,
    updated_by TEXT
);

-- ============================================================================
-- DRAFTS TABLE
-- Stores response drafts for opportunities
-- Immutable after approval
-- ============================================================================
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,

    -- Draft content
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT NOT NULL,

    -- Pricing breakdown (JSONB for flexibility)
    pricing_breakdown JSONB, -- e.g., { "materials": 100, "labor": 200, "shipping": 50 }
    total_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',

    -- Approval state
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,

    -- Immutability enforcement
    is_locked BOOLEAN NOT NULL DEFAULT FALSE, -- Locked after approval

    -- Metadata
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Audit
    created_by TEXT,
    updated_by TEXT,

    -- Constraints
    CONSTRAINT unique_opportunity_version UNIQUE (opportunity_id, version),
    CONSTRAINT approved_drafts_must_be_locked CHECK (NOT is_approved OR is_locked = TRUE)
);

-- ============================================================================
-- JOBS TABLE
-- Tracks fulfillment of approved opportunities
-- ============================================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE RESTRICT,
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE RESTRICT,

    -- Job identification
    job_number TEXT NOT NULL UNIQUE, -- e.g., "JOB-2026-001"
    service_type service_type NOT NULL,
    status job_status NOT NULL DEFAULT 'approved',

    -- Job details
    title TEXT NOT NULL,
    description TEXT,

    -- Physical job fields
    print_duration_hours DECIMAL(10,2),
    material_used_grams DECIMAL(10,2),
    post_processing_notes TEXT,

    -- Software job fields
    scope_delivered TEXT,
    hours_logged DECIMAL(10,2),
    deliverables_url TEXT,

    -- Financial
    agreed_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Audit
    created_by TEXT,
    updated_by TEXT
);

-- ============================================================================
-- FULFILLMENT_STEPS TABLE
-- Tracks state transitions and progress for jobs
-- Append-only audit trail
-- ============================================================================
CREATE TABLE fulfillment_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- State transition
    from_status job_status,
    to_status job_status NOT NULL,

    -- Evidence
    notes TEXT,
    attachments JSONB, -- URLs or references to files

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Audit
    created_by TEXT NOT NULL
);

-- ============================================================================
-- REVENUE_EVENTS TABLE
-- Tracks all revenue-related events
-- Append-only for accounting compliance
-- ============================================================================
CREATE TABLE revenue_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,

    -- Event details
    event_type TEXT NOT NULL, -- e.g., "invoice_sent", "payment_received", "refund_issued"
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',

    -- Payment details
    payment_method TEXT, -- e.g., "interac", "credit_card", "wire_transfer"
    transaction_id TEXT,

    -- Metadata
    notes TEXT,

    -- Timestamps
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Audit
    created_by TEXT NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Opportunities
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_service_type ON opportunities(service_type);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_opportunities_contact_email ON opportunities(contact_email);

-- Drafts
CREATE INDEX idx_drafts_opportunity_id ON drafts(opportunity_id);
CREATE INDEX idx_drafts_is_approved ON drafts(is_approved);
CREATE INDEX idx_drafts_created_at ON drafts(created_at DESC);

-- Jobs
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_service_type ON jobs(service_type);
CREATE INDEX idx_jobs_opportunity_id ON jobs(opportunity_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Fulfillment Steps
CREATE INDEX idx_fulfillment_steps_job_id ON fulfillment_steps(job_id);
CREATE INDEX idx_fulfillment_steps_created_at ON fulfillment_steps(created_at DESC);

-- Revenue Events
CREATE INDEX idx_revenue_events_job_id ON revenue_events(job_id);
CREATE INDEX idx_revenue_events_event_type ON revenue_events(event_type);
CREATE INDEX idx_revenue_events_event_date ON revenue_events(event_date DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent updates to locked drafts
CREATE OR REPLACE FUNCTION prevent_locked_draft_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_locked = TRUE THEN
        RAISE EXCEPTION 'Cannot update locked draft (ID: %)', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_draft_immutability
    BEFORE UPDATE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_locked_draft_updates();

-- Auto-lock drafts when approved
CREATE OR REPLACE FUNCTION auto_lock_approved_draft()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_approved = TRUE AND OLD.is_approved = FALSE THEN
        NEW.is_locked = TRUE;
        NEW.approved_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_draft_on_approval
    BEFORE UPDATE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION auto_lock_approved_draft();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Placeholder - will be enabled when auth is configured
-- ============================================================================

-- ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fulfillment_steps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
