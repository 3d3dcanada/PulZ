'use client';

/**
 * PulZ Opportunity Intake
 * Phase D0 Hard Execution Mode
 *
 * Real opportunity intake form with validation and persistence.
 * Supports dual service types: physical (3D printing) and software (consulting/dev).
 */

import { useState, useEffect } from 'react';
import { revenueApi } from '@/lib/revenue/client';
import {
  ServiceType,
  CreateOpportunityInput,
  Opportunity,
  validateOpportunityInput,
} from '@/lib/revenue/types';
import Link from 'next/link';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateOpportunityInput>({
    service_type: 'physical',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_company: '',
    title: '',
    description: '',
    material_type: '',
    quantity: 1,
    dimensions: '',
    estimated_value: 0,
    currency: 'CAD',
    source: 'website',
  });

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function loadOpportunities() {
    try {
      setLoading(true);
      const data = await revenueApi.listOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    // Validate
    const validationErrors = validateOpportunityInput(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      const created = await revenueApi.createOpportunity(formData);
      setSuccessMessage(`Opportunity "${created.title}" created successfully!`);

      // Reset form
      setFormData({
        service_type: 'physical',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_company: '',
        title: '',
        description: '',
        material_type: '',
        quantity: 1,
        dimensions: '',
        estimated_value: 0,
        currency: 'CAD',
        source: 'website',
      });

      // Reload opportunities
      await loadOpportunities();

      // Hide form after success
      setTimeout(() => {
        setShowForm(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      setErrors([`Failed to create opportunity: ${error}`]);
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field: keyof CreateOpportunityInput, value: unknown) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    reviewing: 'bg-yellow-500/20 text-yellow-400',
    drafting: 'bg-purple-500/20 text-purple-400',
    approved: 'bg-green-500/20 text-green-400',
    declined: 'bg-red-500/20 text-red-400',
    completed: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Opportunity Intake</h1>
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
              href="/pulz/drafts"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
            >
              Drafts
            </Link>
            <Link
              href="/pulz/executions"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              Executions
            </Link>
            <Link
              href="/pulz/jobs"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Jobs
            </Link>
            <Link
              href="/pulz/telemetry"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition"
            >
              Telemetry
            </Link>
            <Link
              href="/pulz/revenue"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
            >
              Revenue
            </Link>
            <Link
              href="/pulz/activity"
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
            >
              Activity
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              {showForm ? 'Hide Form' : 'New Opportunity'}
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
            <p className="font-semibold mb-2">Validation Errors:</p>
            <ul className="list-disc list-inside">
              {errors.map((error, idx) => (
                <li key={idx} className="text-red-400">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Intake Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-[#131824] rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6">Create New Opportunity</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Service Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="service_type"
                      value="physical"
                      checked={formData.service_type === 'physical'}
                      onChange={(e) => updateField('service_type', e.target.value as ServiceType)}
                      className="mr-2"
                    />
                    <span>Physical (3D Printing)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="service_type"
                      value="software"
                      checked={formData.service_type === 'software'}
                      onChange={(e) => updateField('service_type', e.target.value as ServiceType)}
                      className="mr-2"
                    />
                    <span>Software (Consulting/Dev)</span>
                  </label>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Name *</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => updateField('contact_name', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.contact_company}
                    onChange={(e) => updateField('contact_company', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opportunity Details */}
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Physical Service Fields */}
              {formData.service_type === 'physical' && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-500/10 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">Material Type *</label>
                    <input
                      type="text"
                      value={formData.material_type || ''}
                      onChange={(e) => updateField('material_type', e.target.value)}
                      className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="PLA, ABS, PETG..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity || 1}
                      onChange={(e) => updateField('quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Dimensions</label>
                    <input
                      type="text"
                      value={formData.dimensions || ''}
                      onChange={(e) => updateField('dimensions', e.target.value)}
                      className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="100x50x25mm"
                    />
                  </div>
                </div>
              )}

              {/* Software Service Fields */}
              {formData.service_type === 'software' && (
                <div className="p-4 bg-purple-500/10 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Scope Description *</label>
                    <textarea
                      value={formData.scope_description || ''}
                      onChange={(e) => updateField('scope_description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Describe the software project scope..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Estimated Hours</label>
                      <input
                        type="number"
                        value={formData.estimated_hours || ''}
                        onChange={(e) => updateField('estimated_hours', parseFloat(e.target.value))}
                        step="0.5"
                        min="0"
                        className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Delivery Deadline</label>
                      <input
                        type="date"
                        value={formData.delivery_deadline?.split('T')[0] || ''}
                        onChange={(e) => updateField('delivery_deadline', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                        className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Financial */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Value</label>
                  <input
                    type="number"
                    value={formData.estimated_value || ''}
                    onChange={(e) => updateField('estimated_value', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => updateField('source', e.target.value)}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="website">Website</option>
                    <option value="email">Email</option>
                    <option value="referral">Referral</option>
                    <option value="tender">Tender</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
                >
                  {submitting ? 'Creating...' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Opportunities List */}
        <div className="bg-[#131824] rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-semibold">All Opportunities</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading opportunities...</div>
          ) : opportunities.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No opportunities yet. Click &ldquo;New Opportunity&rdquo; to create one.
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {opportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/pulz/opportunities/${opp.id}`}
                  className="block p-6 hover:bg-[#1a2030] transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{opp.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[opp.status]}`}>
                          {opp.status}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                          {opp.service_type}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-2">{opp.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{opp.contact_name}</span>
                        <span>{opp.contact_email}</span>
                        {opp.estimated_value && (
                          <span className="text-green-400">
                            ${opp.estimated_value.toFixed(2)} {opp.currency}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(opp.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
