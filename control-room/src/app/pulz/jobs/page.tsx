'use client';

/**
 * PulZ Fulfillment Tracking
 * Phase D0 Hard Execution Mode
 *
 * Track jobs through their lifecycle: approved → printing → post_processing → packed → shipped → paid
 * Supports both physical (3D printing) and software (consulting/dev) jobs.
 *
 * 🔐 Authentication required - protected by AuthGuard.
 */

import { useState, useEffect } from 'react';
import { revenueApi } from '@/lib/revenue/client';
import { AuthGuard } from '@/lib/auth/AuthGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Job,
  JobStatus,
  Draft,
  Opportunity,
  CreateJobInput,
} from '@/lib/revenue/types';
import Link from 'next/link';

const JOB_STATUSES: JobStatus[] = [
  'approved',
  'printing',
  'post_processing',
  'packed',
  'shipped',
  'paid',
];

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [approvedDrafts, setApprovedDrafts] = useState<Draft[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [jobsData, oppsData] = await Promise.all([
        revenueApi.listJobs(),
        revenueApi.listOpportunities(),
      ]);

      setJobs(jobsData);
      setOpportunities(oppsData);

      // Load all drafts and filter for approved ones
      const draftsPromises = oppsData.map((opp) =>
        revenueApi.listDraftsByOpportunity(opp.id)
      );
      const allDrafts = (await Promise.all(draftsPromises)).flat();
      const approved = allDrafts.filter((d) => d.is_approved);

      // Filter out drafts that already have jobs
      const draftIdsWithJobs = new Set(jobsData.map((j) => j.draft_id));
      const availableDrafts = approved.filter((d) => !draftIdsWithJobs.has(d.id));

      setApprovedDrafts(availableDrafts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateJob() {
    setErrors([]);
    setSuccessMessage('');

    if (!selectedDraftId) {
      setErrors(['Please select an approved draft']);
      return;
    }

    const draft = approvedDrafts.find((d) => d.id === selectedDraftId);
    if (!draft) {
      setErrors(['Draft not found']);
      return;
    }

    const opp = opportunities.find((o) => o.id === draft.opportunity_id);
    if (!opp) {
      setErrors(['Opportunity not found']);
      return;
    }

    // Generate job number
    const jobNumber = `JOB-${new Date().getFullYear()}-${String(jobs.length + 1).padStart(3, '0')}`;

    const input: CreateJobInput = {
      opportunity_id: opp.id,
      draft_id: draft.id,
      job_number: jobNumber,
      service_type: opp.service_type,
      title: draft.title,
      description: opp.description,
      agreed_price: draft.total_price,
      currency: draft.currency,
    };

    try {
      const created = await revenueApi.createJob(input);
      setSuccessMessage(`Job ${created.job_number} created successfully!`);

      // Reload data
      await loadData();

      // Reset
      setSelectedDraftId('');
      setShowCreateForm(false);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrors([`Failed to create job: ${error}`]);
    }
  }

  async function handleUpdateJobStatus(jobId: string, newStatus: JobStatus) {
    try {
      await revenueApi.updateJobStatus({
        job_id: jobId,
        status: newStatus,
        updated_by: user?.id || 'unknown',
        notes: `Status changed to ${newStatus}`,
      });

      setSuccessMessage(`Job status updated to ${newStatus}`);

      // Reload jobs
      await loadData();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrors([`Failed to update job status: ${error}`]);
    }
  }

  const statusColors: Record<JobStatus, string> = {
    approved: 'bg-blue-500/20 text-blue-400 border-blue-500',
    printing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    post_processing: 'bg-purple-500/20 text-purple-400 border-purple-500',
    packed: 'bg-cyan-500/20 text-cyan-400 border-cyan-500',
    shipped: 'bg-orange-500/20 text-orange-400 border-orange-500',
    paid: 'bg-green-500/20 text-green-400 border-green-500',
  };

  const jobsByStatus = JOB_STATUSES.reduce((acc, status) => {
    acc[status] = jobs.filter((j) => j.status === status);
    return acc;
  }, {} as Record<JobStatus, Job[]>);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fulfillment Tracking</h1>
            <p className="text-gray-400">
              Backend: <span className="text-blue-400">{revenueApi.backendType}</span> •{' '}
              <span className="text-green-400">{jobs.length} total jobs</span>
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/pulz/opportunities"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Opportunities
            </Link>
            <Link
              href="/pulz/drafts"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
            >
              Drafts
            </Link>
            <Link
              href="/pulz/revenue"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
            >
              Revenue
            </Link>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
              disabled={approvedDrafts.length === 0}
            >
              {showCreateForm ? 'Hide Form' : 'Create Job'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="font-semibold mb-2">Errors:</p>
            <ul className="list-disc list-inside">
              {errors.map((error, idx) => (
                <li key={idx} className="text-red-400">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create Job Form */}
        {showCreateForm && (
          <div className="mb-8 bg-[#131824] rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">Create Job from Approved Draft</h2>
            {approvedDrafts.length === 0 ? (
              <p className="text-gray-400">No approved drafts available without jobs.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Approved Draft</label>
                  <select
                    value={selectedDraftId}
                    onChange={(e) => setSelectedDraftId(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="">-- Select Draft --</option>
                    {approvedDrafts.map((draft) => {
                      const opp = opportunities.find((o) => o.id === draft.opportunity_id);
                      return (
                        <option key={draft.id} value={draft.id}>
                          {draft.title} (v{draft.version}) - {opp?.title} - $
                          {draft.total_price.toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateJob}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    Create Job
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kanban Board */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center bg-[#131824] rounded-lg border border-gray-700">
            <p className="text-gray-400 text-lg mb-4">No jobs yet</p>
            <p className="text-gray-500">
              Create a job from an approved draft to start tracking fulfillment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {JOB_STATUSES.map((status) => (
              <div key={status} className="space-y-3">
                {/* Column Header */}
                <div className={`p-3 rounded-lg border ${statusColors[status]}`}>
                  <h3 className="font-semibold capitalize text-center">{status.replace('_', ' ')}</h3>
                  <p className="text-xs text-center mt-1 opacity-75">
                    {jobsByStatus[status].length} job{jobsByStatus[status].length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Jobs */}
                <div className="space-y-2">
                  {jobsByStatus[status].map((job) => {
                    const opp = opportunities.find((o) => o.id === job.opportunity_id);
                    const currentIndex = JOB_STATUSES.indexOf(job.status);
                    const canMoveForward = currentIndex < JOB_STATUSES.length - 1;
                    const canMoveBack = currentIndex > 0;

                    return (
                      <div
                        key={job.id}
                        className="bg-[#131824] border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition"
                      >
                        <div className="text-sm font-semibold mb-1 truncate">{job.title}</div>
                        <div className="text-xs text-gray-500 mb-2">{job.job_number}</div>
                        <div className="text-xs text-gray-400 mb-2 truncate">
                          {opp?.contact_name}
                        </div>
                        <div className="text-sm font-bold text-green-400 mb-3">
                          ${job.agreed_price.toFixed(2)}
                        </div>
                        <div className="flex flex-col gap-1">
                          {canMoveForward && (
                            <button
                              onClick={() => handleUpdateJobStatus(job.id, JOB_STATUSES[currentIndex + 1])}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition"
                            >
                              → {JOB_STATUSES[currentIndex + 1].replace('_', ' ')}
                            </button>
                          )}
                          {canMoveBack && (
                            <button
                              onClick={() => handleUpdateJobStatus(job.id, JOB_STATUSES[currentIndex - 1])}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition"
                            >
                              ← {JOB_STATUSES[currentIndex - 1].replace('_', ' ')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  );
}
