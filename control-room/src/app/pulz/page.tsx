'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { revenueApi } from '@/lib/revenue/client'
import { getPulzUser } from '@/lib/pulz/user'

type SummaryState = {
  totalRevenue: number
  totalJobs: number
  currency: string
}

export default function PulzDashboardPage() {
  const [summary, setSummary] = useState<SummaryState | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetStatus, setResetStatus] = useState<string | null>(null)
  const user = getPulzUser()

  useEffect(() => {
    let isMounted = true
    async function loadSummary() {
      try {
        setLoading(true)
        const data = await revenueApi.getRevenueSummary()
        if (isMounted) {
          setSummary({
            totalRevenue: data.total_revenue,
            totalJobs: data.total_jobs,
            currency: data.currency,
          })
        }
      } catch (error) {
        console.error('Failed to load summary:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadSummary()
    return () => {
      isMounted = false
    }
  }, [])

  function handleReset() {
    revenueApi.resetLocalData()
    setResetStatus('Local data reset for this account.')
    setTimeout(() => setResetStatus(null), 2500)
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">PulZ Dashboard</h1>
            <p className="text-gray-400">
              Operator:{' '}
              <span className="text-blue-400">
                {user ? `${user.display_name} (${user.role})` : 'Local operator'}
              </span>
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
            <Link
              href="/pulz/activity"
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
            >
              Activity
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 bg-[#131824] border border-gray-700 rounded-lg">
            <p className="text-sm uppercase text-gray-400">Total Revenue</p>
            <p className="text-2xl font-semibold mt-2">
              {loading
                ? 'Loading...'
                : summary
                  ? `${summary.totalRevenue.toLocaleString()} ${summary.currency}`
                  : '--'}
            </p>
          </div>
          <div className="p-6 bg-[#131824] border border-gray-700 rounded-lg">
            <p className="text-sm uppercase text-gray-400">Total Jobs</p>
            <p className="text-2xl font-semibold mt-2">
              {loading ? 'Loading...' : summary ? summary.totalJobs : '--'}
            </p>
          </div>
          <div className="p-6 bg-[#131824] border border-gray-700 rounded-lg">
            <p className="text-sm uppercase text-gray-400">Backend</p>
            <p className="text-2xl font-semibold mt-2">{revenueApi.backendType}</p>
          </div>
        </div>

        <div className="p-6 bg-[#131824] border border-gray-700 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Local Data</h2>
          <p className="text-gray-400 mb-4">
            This resets PulZ data stored in this browser for the current account only.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Reset my local PulZ data
          </button>
          {resetStatus && <p className="text-green-400 mt-3">{resetStatus}</p>}
        </div>
      </div>
    </div>
  )
}
