'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type TelemetrySummary = {
  tokens_over_time: { ts: string; tokens: number }[]
  total_tokens: number
  total_cost_usd: number
  cost_per_signal: number
  cost_per_proposal: number
  cost_per_execution: number
  roi_by_source: {
    source: string
    signals: number
    cost_usd: number
    revenue_cents: number | null
    roi: number | null
    unrealized: boolean
  }[]
  config: { cost_per_1m_tokens_usd: Record<string, number> }
}

export default function TelemetryPage() {
  const [summary, setSummary] = useState<TelemetrySummary | null>(null)

  async function loadSummary() {
    const response = await fetch('/api/pulz/telemetry/summary')
    const data = (await response.json()) as TelemetrySummary
    setSummary(data)
  }

  useEffect(() => {
    loadSummary()
    const interval = setInterval(loadSummary, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Economic Telemetry</h1>
            <p className="text-gray-400">Token burn, unit economics, and ROI per source.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/pulz" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
              Dashboard
            </Link>
            <Link
              href="/pulz/executions"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              Executions
            </Link>
            <Link
              href="/pulz/activity"
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
            >
              Activity
            </Link>
          </div>
        </div>

        {!summary && <p className="text-gray-400">Loading telemetry...</p>}
        {summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#131824] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total tokens</p>
                <p className="text-2xl font-semibold">{summary.total_tokens.toLocaleString()}</p>
              </div>
              <div className="bg-[#131824] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total cost</p>
                <p className="text-2xl font-semibold">${summary.total_cost_usd.toFixed(4)}</p>
                <p className="text-xs text-gray-500">
                  {Object.entries(summary.config.cost_per_1m_tokens_usd)
                    .map(([key, value]) => `${key}: $${value}`)
                    .join(' · ')}{' '}
                  / 1M tokens
                </p>
              </div>
              <div className="bg-[#131824] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Cost per signal</p>
                <p className="text-2xl font-semibold">${summary.cost_per_signal.toFixed(4)}</p>
              </div>
              <div className="bg-[#131824] border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Cost per proposal</p>
                <p className="text-2xl font-semibold">${summary.cost_per_proposal.toFixed(4)}</p>
                <p className="text-xs text-gray-500">
                  Cost per execution: ${summary.cost_per_execution.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Token burn over time</h2>
              {summary.tokens_over_time.length === 0 ? (
                <p className="text-gray-400 text-sm">No token events yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {summary.tokens_over_time.map((row) => (
                    <li key={row.ts} className="flex items-center justify-between">
                      <span>{row.ts}</span>
                      <span>{row.tokens.toLocaleString()} tokens</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-[#131824] border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">ROI by source</h2>
              <div className="space-y-3 text-sm">
                {summary.roi_by_source.length === 0 ? (
                  <p className="text-gray-400">No sources tracked yet.</p>
                ) : (
                  summary.roi_by_source.map((row) => (
                    <div
                      key={row.source}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-gray-700 pb-3"
                    >
                      <div>
                        <p className="text-blue-300 font-semibold">{row.source}</p>
                        <p className="text-xs text-gray-500">
                          {row.signals} signals · cost ${row.cost_usd.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-xs text-gray-300">
                        Revenue:{' '}
                        {row.unrealized
                          ? 'Unrealized'
                          : `$${((row.revenue_cents ?? 0) / 100).toFixed(2)}`}
                        {' · '}ROI: {row.roi === null ? 'Unrealized' : row.roi.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
