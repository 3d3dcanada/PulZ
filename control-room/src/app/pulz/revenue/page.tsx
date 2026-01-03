'use client';

/**
 * PulZ Revenue Tracking
 * Phase D0 Hard Execution Mode
 *
 * Track revenue events and view financial summary.
 * Append-only event log for accounting compliance.
 */

import { useState, useEffect } from 'react';
import { revenueApi } from '@/lib/revenue/client';
import {
  RevenueEvent,
  CreateRevenueEventInput,
  RevenueSummary,
  Job,
} from '@/lib/revenue/types';
import Link from 'next/link';

export default function RevenuePage() {
  const [revenueEvents, setRevenueEvents] = useState<RevenueEvent[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<Omit<CreateRevenueEventInput, 'created_by'>>({
    job_id: '',
    event_type: 'payment_received',
    amount: 0,
    currency: 'CAD',
    payment_method: '',
    transaction_id: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [eventsData, summaryData, jobsData] = await Promise.all([
        revenueApi.listAllRevenueEvents(),
        revenueApi.getRevenueSummary(),
        revenueApi.listJobs(),
      ]);

      setRevenueEvents(eventsData);
      setSummary(summaryData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    if (!formData.job_id) {
      setErrors(['Please select a job']);
      return;
    }

    if (formData.amount <= 0) {
      setErrors(['Amount must be greater than 0']);
      return;
    }

    const input: CreateRevenueEventInput = {
      ...formData,
      created_by: 'operator', // TODO: Use actual user ID when auth is implemented
    };

    try {
      const created = await revenueApi.createRevenueEvent(input);
      setSuccessMessage(`Revenue event created: ${created.event_type}`);

      // Reset form
      setFormData({
        job_id: '',
        event_type: 'payment_received',
        amount: 0,
        currency: 'CAD',
        payment_method: '',
        transaction_id: '',
        notes: '',
      });

      // Reload data
      await loadData();

      // Hide form after success
      setTimeout(() => {
        setShowCreateForm(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      setErrors([`Failed to create revenue event: ${error}`]);
    }
  }

  function updateField(field: keyof typeof formData, value: unknown) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const eventTypeColors: Record<string, string> = {
    invoice_sent: 'bg-blue-500/20 text-blue-400',
    payment_received: 'bg-green-500/20 text-green-400',
    refund_issued: 'bg-red-500/20 text-red-400',
    discount_applied: 'bg-yellow-500/20 text-yellow-400',
    late_fee_added: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Revenue Tracking</h1>
            <p className="text-gray-400">
              Backend: <span className="text-blue-400">{revenueApi.backendType}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/pulz"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              Dashboard
            </Link>
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
              href="/pulz/jobs"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Jobs
            </Link>
            <Link
              href="/pulz/activity"
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
            >
              Activity
            </Link>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
            >
              {showCreateForm ? 'Hide Form' : 'Log Revenue Event'}
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

        {/* Revenue Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-400">
                ${summary.total_revenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{summary.currency}</p>
            </div>

            <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Total Jobs</h3>
              <p className="text-3xl font-bold text-blue-400">{summary.total_jobs}</p>
            </div>

            <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Physical Revenue</h3>
              <p className="text-3xl font-bold text-cyan-400">
                ${summary.revenue_by_service_type.physical.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">3D Printing</p>
            </div>

            <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Software Revenue</h3>
              <p className="text-3xl font-bold text-purple-400">
                ${summary.revenue_by_service_type.software.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Consulting/Dev</p>
            </div>
          </div>
        )}

        {/* Job Status Breakdown */}
        {summary && (
          <div className="bg-[#131824] border border-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Jobs by Status</h3>
            <div className="grid grid-cols-6 gap-4">
              {Object.entries(summary.jobs_by_status).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-300">{count}</div>
                  <div className="text-xs text-gray-500 capitalize mt-1">
                    {status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Revenue Event Form */}
        {showCreateForm && (
          <div className="mb-8 bg-[#131824] rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">Log Revenue Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Job *</label>
                  <select
                    value={formData.job_id}
                    onChange={(e) => updateField('job_id', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Job --</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.job_number} - {job.title} (${job.agreed_price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Event Type *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => updateField('event_type', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none"
                    required
                  >
                    <option value="invoice_sent">Invoice Sent</option>
                    <option value="payment_received">Payment Received</option>
                    <option value="refund_issued">Refund Issued</option>
                    <option value="discount_applied">Discount Applied</option>
                    <option value="late_fee_added">Late Fee Added</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => updateField('amount', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <input
                    type="text"
                    value={formData.payment_method}
                    onChange={(e) => updateField('payment_method', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none"
                    placeholder="interac, credit_card, wire_transfer..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => updateField('transaction_id', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
                >
                  Log Event
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Revenue Events Log */}
        <div className="bg-[#131824] rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-semibold">Revenue Events (Append-Only)</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading revenue events...</div>
          ) : revenueEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No revenue events yet. Click &ldquo;Log Revenue Event&rdquo; to create one.
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {revenueEvents.map((event) => {
                const job = jobs.find((j) => j.id === event.job_id);
                return (
                  <div key={event.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 text-sm rounded-full ${
                              eventTypeColors[event.event_type] || 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {event.event_type.replace('_', ' ')}
                          </span>
                          {job && (
                            <span className="text-sm text-gray-400">{job.job_number}</span>
                          )}
                        </div>
                        {job && (
                          <p className="text-gray-300 mb-2">{job.title}</p>
                        )}
                        {event.notes && (
                          <p className="text-sm text-gray-400 mb-2">{event.notes}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          {event.payment_method && <span>via {event.payment_method}</span>}
                          {event.transaction_id && <span>Txn: {event.transaction_id}</span>}
                          <span>
                            {new Date(event.event_date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          event.event_type === 'refund_issued' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {event.event_type === 'refund_issued' ? '-' : '+'}$
                          {event.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{event.currency}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
