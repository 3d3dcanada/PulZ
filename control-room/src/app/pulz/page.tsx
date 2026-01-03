'use client';

/**
 * PulZ Control Room Dashboard
 * Phase D0 Hard Execution Mode
 *
 * Central command center for revenue operations.
 * Shows summary metrics and live activity feed.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/lib/auth/AuthGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRevenue } from '@/lib/revenue/useRevenue';
import ActivityFeed from '@/components/ActivityFeed';
import type { RevenueSummary } from '@/lib/revenue/types';

export default function PulZDashboard() {
  const { user } = useAuth();
  const { getRevenueSummary } = useRevenue();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = () => {
      try {
        const data = getRevenueSummary();
        setSummary(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load summary:', error);
        setLoading(false);
      }
    };

    // Initial load
    loadSummary();

    // Refresh every 5 seconds
    const interval = setInterval(loadSummary, 5000);

    return () => clearInterval(interval);
  }, [getRevenueSummary]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-[#131824]">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">PulZ Control Room</h1>
                <p className="text-gray-400">
                  Welcome back, <span className="text-blue-400">{user?.display_name}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/pulz/opportunities"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
                >
                  New Opportunity
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Metrics Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading metrics...</div>
              ) : (
                <>
                  {/* Revenue Card */}
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">💰</div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-400">Total Revenue</h3>
                        <p className="text-sm text-gray-400">Lifetime earnings</p>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-green-400">
                      ${summary?.total_revenue.toFixed(2) || '0.00'}
                      <span className="text-xl text-gray-500 ml-2">{summary?.currency}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Physical:</span>{' '}
                        <span className="text-white font-medium">
                          ${summary?.revenue_by_service_type.physical.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Software:</span>{' '}
                        <span className="text-white font-medium">
                          ${summary?.revenue_by_service_type.software.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                      href="/pulz/opportunities"
                      className="bg-[#131824] border border-gray-700 rounded-lg p-4 hover:bg-[#1a1f2e] transition group"
                    >
                      <div className="text-2xl mb-2">📥</div>
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {summary?.total_jobs || 0}
                      </div>
                      <div className="text-sm text-gray-400 group-hover:text-gray-300">
                        Total Jobs
                      </div>
                    </Link>

                    <Link
                      href="/pulz/drafts"
                      className="bg-[#131824] border border-gray-700 rounded-lg p-4 hover:bg-[#1a1f2e] transition group"
                    >
                      <div className="text-2xl mb-2">📝</div>
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {summary?.jobs_by_status.approved || 0}
                      </div>
                      <div className="text-sm text-gray-400 group-hover:text-gray-300">
                        Pending Approval
                      </div>
                    </Link>

                    <Link
                      href="/pulz/jobs"
                      className="bg-[#131824] border border-gray-700 rounded-lg p-4 hover:bg-[#1a1f2e] transition group"
                    >
                      <div className="text-2xl mb-2">🔧</div>
                      <div className="text-2xl font-bold text-cyan-400 mb-1">
                        {(summary?.jobs_by_status.printing || 0) +
                          (summary?.jobs_by_status.post_processing || 0) +
                          (summary?.jobs_by_status.packed || 0)}
                      </div>
                      <div className="text-sm text-gray-400 group-hover:text-gray-300">
                        In Progress
                      </div>
                    </Link>

                    <Link
                      href="/pulz/revenue"
                      className="bg-[#131824] border border-gray-700 rounded-lg p-4 hover:bg-[#1a1f2e] transition group"
                    >
                      <div className="text-2xl mb-2">✅</div>
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {summary?.jobs_by_status.paid || 0}
                      </div>
                      <div className="text-sm text-gray-400 group-hover:text-gray-300">
                        Completed & Paid
                      </div>
                    </Link>
                  </div>

                  {/* Job Pipeline Status */}
                  <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Job Pipeline</h3>
                    <div className="space-y-3">
                      {Object.entries(summary?.jobs_by_status || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-gray-400 capitalize">
                            {status.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-800 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${summary?.total_jobs ? (count / summary.total_jobs) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-white font-medium w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Activity Feed Column */}
            <div className="space-y-6">
              <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Live Activity</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                </div>
                <ActivityFeed limit={15} pollInterval={2000} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
