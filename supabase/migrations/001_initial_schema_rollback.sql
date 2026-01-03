-- Rollback for 001_initial_schema.sql
-- Phase D0 Hard Execution Mode
-- Created: 2026-01-03

-- Drop triggers
DROP TRIGGER IF EXISTS lock_draft_on_approval ON drafts;
DROP TRIGGER IF EXISTS enforce_draft_immutability ON drafts;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;

-- Drop functions
DROP FUNCTION IF EXISTS auto_lock_approved_draft();
DROP FUNCTION IF EXISTS prevent_locked_draft_updates();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_revenue_events_event_date;
DROP INDEX IF EXISTS idx_revenue_events_event_type;
DROP INDEX IF EXISTS idx_revenue_events_job_id;
DROP INDEX IF EXISTS idx_fulfillment_steps_created_at;
DROP INDEX IF EXISTS idx_fulfillment_steps_job_id;
DROP INDEX IF EXISTS idx_jobs_created_at;
DROP INDEX IF EXISTS idx_jobs_opportunity_id;
DROP INDEX IF EXISTS idx_jobs_service_type;
DROP INDEX IF EXISTS idx_jobs_status;
DROP INDEX IF EXISTS idx_drafts_created_at;
DROP INDEX IF EXISTS idx_drafts_is_approved;
DROP INDEX IF EXISTS idx_drafts_opportunity_id;
DROP INDEX IF EXISTS idx_opportunities_contact_email;
DROP INDEX IF EXISTS idx_opportunities_created_at;
DROP INDEX IF EXISTS idx_opportunities_service_type;
DROP INDEX IF EXISTS idx_opportunities_status;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS revenue_events;
DROP TABLE IF EXISTS fulfillment_steps;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS drafts;
DROP TABLE IF EXISTS opportunities;

-- Drop enums
DROP TYPE IF EXISTS job_status;
DROP TYPE IF EXISTS opportunity_status;
DROP TYPE IF EXISTS service_type;
