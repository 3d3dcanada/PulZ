/**
 * PulZ Revenue Hooks
 * Phase D0 Hard Execution Mode
 *
 * React hooks for revenue operations with user context.
 * Automatically passes authenticated user to all operations.
 */

'use client';

import { useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { LocalStorageAdapter } from './localStorage';
import type {
  CreateOpportunityInput,
  CreateDraftInput,
  ApproveDraftInput,
  CreateJobInput,
  UpdateJobStatusInput,
  CreateRevenueEventInput,
} from './types';

// Singleton adapter instance
const adapter = new LocalStorageAdapter();

/**
 * Hook for revenue operations
 *
 * Automatically injects user context into all mutations.
 */
export function useRevenue() {
  const { user } = useAuth();

  return {
    // Opportunities
    createOpportunity: useCallback(
      async (input: CreateOpportunityInput) => {
        if (!user) throw new Error('User not authenticated');
        return adapter.createOpportunity(input, user);
      },
      [user]
    ),
    getOpportunity: useCallback((id: string) => adapter.getOpportunity(id), []),
    listOpportunities: useCallback(() => adapter.listOpportunities(), []),

    // Drafts
    createDraft: useCallback(
      async (input: CreateDraftInput) => {
        if (!user) throw new Error('User not authenticated');
        return adapter.createDraft(input, user);
      },
      [user]
    ),
    getDraft: useCallback((id: string) => adapter.getDraft(id), []),
    listDraftsByOpportunity: useCallback(
      (opportunityId: string) => adapter.listDraftsByOpportunity(opportunityId),
      []
    ),
    approveDraft: useCallback(
      async (input: ApproveDraftInput) => {
        if (!user) throw new Error('User not authenticated');
        return adapter.approveDraft(input, user);
      },
      [user]
    ),

    // Jobs
    createJob: useCallback(
      async (input: CreateJobInput) => {
        if (!user) throw new Error('User not authenticated');
        return adapter.createJob(input, user);
      },
      [user]
    ),
    getJob: useCallback((id: string) => adapter.getJob(id), []),
    listJobs: useCallback(() => adapter.listJobs(), []),
    updateJobStatus: useCallback(
      async (input: UpdateJobStatusInput) => {
        if (!user) throw new Error('User not authenticated');
        return adapter.updateJobStatus(input, user);
      },
      [user]
    ),

    // Fulfillment Steps
    listFulfillmentStepsByJob: useCallback(
      (jobId: string) => adapter.listFulfillmentStepsByJob(jobId),
      []
    ),

    // Revenue Events
    createRevenueEvent: useCallback(
      async (input: CreateRevenueEventInput) => {
        if (!user) throw new Error('User not authenticated');
        return adapter.createRevenueEvent(input, user);
      },
      [user]
    ),
    listRevenueEventsByJob: useCallback(
      (jobId: string) => adapter.listRevenueEventsByJob(jobId),
      []
    ),
    listAllRevenueEvents: useCallback(() => adapter.listAllRevenueEvents(), []),

    // Aggregate queries
    getOpportunityWithDrafts: useCallback(
      (id: string) => adapter.getOpportunityWithDrafts(id),
      []
    ),
    getJobWithDetails: useCallback((id: string) => adapter.getJobWithDetails(id), []),
    getRevenueSummary: useCallback(() => adapter.getRevenueSummary(), []),

    // Activity
    listActivityEvents: useCallback(() => adapter.listActivityEvents(), []),
  };
}

/**
 * Direct access to adapter (for server-side or non-React code)
 */
export { adapter as revenueAdapter };
