'use client';

/**
 * PulZ Response Drafting
 * Phase D0 Hard Execution Mode
 *
 * Create, view, and approve response drafts for opportunities.
 * Drafts are immutable after approval.
 */

import { useState, useEffect } from 'react';
import { revenueApi } from '@/lib/revenue/client';
import {
  Draft,
  Opportunity,
  CreateDraftInput,
  validateDraftInput,
} from '@/lib/revenue/types';
import Link from 'next/link';

export default function DraftsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOppId, setSelectedOppId] = useState<string>('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<Omit<CreateDraftInput, 'opportunity_id'>>({
    title: '',
    content: '',
    total_price: 0,
    currency: 'CAD',
    pricing_breakdown: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedOppId) {
      loadDrafts(selectedOppId);
    }
  }, [selectedOppId]);

  async function loadData() {
    try {
      setLoading(true);
      const opps = await revenueApi.listOpportunities();
      setOpportunities(opps.filter((o) => o.status !== 'declined' && o.status !== 'completed'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDrafts(oppId: string) {
    try {
      const data = await revenueApi.listDraftsByOpportunity(oppId);
      setDrafts(data);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    if (!selectedOppId) {
      setErrors(['Please select an opportunity first']);
      return;
    }

    const input: CreateDraftInput = {
      ...formData,
      opportunity_id: selectedOppId,
    };

    // Validate
    const validationErrors = validateDraftInput(input);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      const created = await revenueApi.createDraft(input);
      setSuccessMessage(`Draft v${created.version} created successfully!`);

      // Reset form
      setFormData({
        title: '',
        content: '',
        total_price: 0,
        currency: 'CAD',
        pricing_breakdown: {},
      });

      // Reload drafts
      await loadDrafts(selectedOppId);

      // Hide form after success
      setTimeout(() => {
        setShowForm(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      setErrors([`Failed to create draft: ${error}`]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveDraft(draftId: string) {
    if (!confirm('Are you sure you want to approve this draft? This action is irreversible.')) {
      return;
    }

    try {
      await revenueApi.approveDraft({
        draft_id: draftId,
        approved_by: 'operator', // TODO: Use actual user ID when auth is implemented
      });

      setSuccessMessage('Draft approved successfully!');

      // Reload drafts
      if (selectedOppId) {
        await loadDrafts(selectedOppId);
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrors([`Failed to approve draft: ${error}`]);
    }
  }

  function updateField(field: keyof typeof formData, value: unknown) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Response Drafting</h1>
            <p className="text-gray-400">
              Backend: <span className="text-blue-400">{revenueApi.backendType}</span>
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
              href="/pulz/jobs"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Jobs
            </Link>
            <Link
              href="/pulz/revenue"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
            >
              Revenue
            </Link>
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

        <div className="grid grid-cols-3 gap-6">
          {/* Opportunity Selector */}
          <div className="col-span-1">
            <div className="bg-[#131824] rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Select Opportunity</h2>
              {loading ? (
                <p className="text-gray-400">Loading...</p>
              ) : opportunities.length === 0 ? (
                <p className="text-gray-400">No active opportunities</p>
              ) : (
                <div className="space-y-2">
                  {opportunities.map((opp) => (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOppId(opp.id)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedOppId === opp.id
                          ? 'bg-blue-600'
                          : 'bg-[#0a0e1a] hover:bg-[#1a2030]'
                      }`}
                    >
                      <div className="font-medium">{opp.title}</div>
                      <div className="text-sm text-gray-400">{opp.contact_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {opp.service_type} • {opp.status}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drafts & Form */}
          <div className="col-span-2">
            {!selectedOppId ? (
              <div className="bg-[#131824] rounded-lg border border-gray-700 p-12 text-center">
                <p className="text-gray-400 text-lg">
                  Select an opportunity to view or create drafts
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Opportunity Info */}
                {selectedOpp && (
                  <div className="bg-[#131824] rounded-lg border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold mb-2">{selectedOpp.title}</h3>
                    <p className="text-gray-400 mb-4">{selectedOpp.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">Contact: {selectedOpp.contact_name}</span>
                      {selectedOpp.estimated_value && (
                        <span className="text-green-400">
                          Est. ${selectedOpp.estimated_value.toFixed(2)} {selectedOpp.currency}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                    >
                      {showForm ? 'Hide Form' : 'Create New Draft'}
                    </button>
                  </div>
                )}

                {/* Draft Form */}
                {showForm && (
                  <div className="bg-[#131824] rounded-lg border border-gray-700 p-6">
                    <h3 className="text-xl font-semibold mb-4">New Draft</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Title *</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => updateField('title', e.target.value)}
                          className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Content *</label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => updateField('content', e.target.value)}
                          rows={8}
                          className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
                          placeholder="Draft your response here..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Total Price *</label>
                          <input
                            type="number"
                            value={formData.total_price}
                            onChange={(e) => updateField('total_price', parseFloat(e.target.value))}
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Currency</label>
                          <select
                            value={formData.currency}
                            onChange={(e) => updateField('currency', e.target.value)}
                            className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                          >
                            <option value="CAD">CAD</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
                        >
                          {submitting ? 'Creating...' : 'Create Draft'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Drafts List */}
                <div className="bg-[#131824] rounded-lg border border-gray-700">
                  <div className="p-6 border-b border-gray-700">
                    <h3 className="text-xl font-semibold">Drafts</h3>
                  </div>

                  {drafts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No drafts yet. Click &ldquo;Create New Draft&rdquo; to get started.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {drafts.map((draft) => (
                        <div key={draft.id} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold">{draft.title}</h4>
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                                  v{draft.version}
                                </span>
                                {draft.is_approved && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                                    ✓ Approved
                                  </span>
                                )}
                                {draft.is_locked && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                                    🔒 Locked
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                Created {new Date(draft.created_at).toLocaleString()}
                                {draft.approved_at && (
                                  <span> • Approved {new Date(draft.approved_at).toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-400">
                                ${draft.total_price.toFixed(2)} {draft.currency}
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#0a0e1a] p-4 rounded-lg mb-4">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                              {draft.content}
                            </pre>
                          </div>

                          {!draft.is_approved && (
                            <button
                              onClick={() => handleApproveDraft(draft.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                            >
                              Approve Draft
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
