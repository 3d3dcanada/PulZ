'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { revenueApi } from '@/lib/revenue/client'
import type { Draft, Job, Opportunity, RevenueEvent } from '@/lib/revenue/types'

type ActivityItem = {
  id: string
  type: string
  title: string
  timestamp: string
  href: string
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export default function ActivityPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ActivityItem[]>([])

  async function loadActivity() {
    try {
      setLoading(true)
      const opportunities = await revenueApi.listOpportunities()
      const jobs = await revenueApi.listJobs()
      let revenueEvents: RevenueEvent[] = []

      try {
        revenueEvents = await revenueApi.listAllRevenueEvents()
      } catch (error) {
        console.warn('Revenue events unavailable:', error)
      }

      const drafts = await loadDrafts(opportunities)
      const activityItems = buildActivityItems(opportunities, drafts, jobs, revenueEvents)
      setItems(activityItems)
    } catch (error) {
      console.error('Failed to load activity:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivity()
    const interval = setInterval(loadActivity, 5000)
    return () => clearInterval(interval)
  }, [])

  const hasItems = items.length > 0
  const latestItems = useMemo(() => items.slice(0, 40), [items])

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Activity Feed</h1>
            <p className="text-gray-400">Updates refresh automatically every few seconds.</p>
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
              href="/pulz/executions"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              Executions
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
          </div>
        </div>

        <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
          {loading && <p className="text-gray-400">Loading activity...</p>}
          {!loading && !hasItems && (
            <p className="text-gray-400">No activity yet. Start by creating an opportunity.</p>
          )}
          {!loading && hasItems && (
            <ul className="space-y-4">
              {latestItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 bg-[#0a0e1a] rounded-lg border border-gray-700"
                >
                  <div>
                    <p className="text-sm uppercase text-gray-400">{item.type}</p>
                    <p className="text-lg font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

async function loadDrafts(opportunities: Opportunity[]): Promise<Draft[]> {
  const draftPromises = opportunities.map((opp) =>
    revenueApi.listDraftsByOpportunity(opp.id)
  )
  const draftsByOpp = await Promise.all(draftPromises)
  return draftsByOpp.flat()
}

function buildActivityItems(
  opportunities: Opportunity[],
  drafts: Draft[],
  jobs: Job[],
  revenueEvents: RevenueEvent[]
): ActivityItem[] {
  const items: ActivityItem[] = []

  opportunities.forEach((opp) => {
    items.push({
      id: `opp-${opp.id}`,
      type: 'Opportunity',
      title: opp.title,
      timestamp: opp.created_at,
      href: `/pulz/opportunities/${opp.id}`,
    })
  })

  drafts.forEach((draft) => {
    items.push({
      id: `draft-${draft.id}`,
      type: 'Draft',
      title: draft.title,
      timestamp: draft.created_at,
      href: `/pulz/drafts`,
    })
  })

  jobs.forEach((job) => {
    items.push({
      id: `job-${job.id}`,
      type: 'Job',
      title: job.title,
      timestamp: job.created_at,
      href: `/pulz/jobs`,
    })
  })

  revenueEvents.forEach((event) => {
    items.push({
      id: `event-${event.id}`,
      type: `Revenue (${event.event_type})`,
      title: `${event.amount.toLocaleString()} ${event.currency}`,
      timestamp: event.event_date,
      href: `/pulz/revenue`,
    })
  })

  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}
