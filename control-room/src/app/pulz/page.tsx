'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getPulzUser } from '@/lib/pulz/user'

type MissionStatus = {
  running: boolean
  started_at?: string | null
  ends_at?: string | null
  sources: string[]
  rate: number
  max_items: number
  items_processed: number
  items_per_min: number
  last_error?: string | null
  last_scan?: string | null
  model_calls?: number
  token_usage?: number | null
  token_usage_available?: boolean
  provider?: string | null
  mission_id?: string | null
  authority_mode?: string | null
  execution_blocked?: boolean
}

type FeedSignal = {
  signal: {
    source: string
    url: string
    title: string
    body_excerpt: string
    author: string
    created_at: string
  }
  scoring: {
    category: string
    feasibility: string
    estimated_build_time_minutes: number
    suggested_price_range: string
    risk_flags: string[]
    recommended_next_action: string
    rationale: string
  }
  proposal?: {
    message_template: string
    suggested_price_range: string
    estimated_build_time_minutes: number
    solution_options: string[]
  }
  status: string
  proposal_id?: string
}

type QueueItem = {
  id: string
  created_at: string
  proposal: {
    message_template: string
    suggested_price_range: string
    estimated_build_time_minutes: number
    solution_options: string[]
    problem_summary: string
  }
  title: string
  url: string
  source: string
}

type ArtifactItem = {
  id: string
  created_at: string
  proposal: {
    message_template: string
    suggested_price_range: string
    estimated_build_time_minutes: number
    solution_options: string[]
    problem_summary: string
  }
}

type ProposalItem = {
  id: string
  status: string
  created_at: string
  updated_at: string
  approved_at?: string | null
  executing_at?: string | null
  executed_at?: string | null
  execution_mode?: string | null
  estimated_revenue_cents?: number | null
  realized_revenue_cents?: number | null
  mission_id?: string | null
  proposal: QueueItem['proposal']
  title: string
  url: string
  source: string
}

const SOURCE_OPTIONS = [
  { id: 'reddit_smallbusiness', label: 'Reddit r/smallbusiness (new)' },
  { id: 'reddit_entrepreneur', label: 'Reddit r/entrepreneur (new)' },
  { id: 'rss_forhire', label: 'Reddit r/forhire (RSS)' },
]

const DURATIONS = [
  { label: '1 hour', value: 1 },
  { label: '4 hours', value: 4 },
  { label: '8 hours', value: 8 },
]

export default function PulzDashboardPage() {
  const user = getPulzUser()
  const [status, setStatus] = useState<MissionStatus | null>(null)
  const [feed, setFeed] = useState<FeedSignal[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [proposals, setProposals] = useState<ProposalItem[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([])
  const [durationHours, setDurationHours] = useState(1)
  const [rate, setRate] = useState(1)
  const [maxItems, setMaxItems] = useState(100)
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'reddit_smallbusiness',
    'rss_forhire',
  ])
  const [authorityMode, setAuthorityMode] = useState('auto_draft_queue')
  const [executionLaneByProposal, setExecutionLaneByProposal] = useState<Record<string, string>>({})
  const [authRequired, setAuthRequired] = useState(false)
  const [missionError, setMissionError] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [backendError, setBackendError] = useState<string | null>(null)

  const sourceSummary = useMemo(
    () => selectedSources.map((source) => SOURCE_OPTIONS.find((s) => s.id === source)?.label ?? source),
    [selectedSources],
  )

  const fetchStatus = useCallback(async () => {
    const response = await fetch('/api/pulz/status')
    if (response.status === 401) {
      setAuthRequired(true)
      return
    }
    const data = (await response.json()) as MissionStatus
    setStatus(data)
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config')
      if (!response.ok) {
        throw new Error(`Config check failed: ${response.status}`)
      }
      setBackendConnected(true)
      setBackendError(null)
    } catch (error) {
      setBackendConnected(false)
      setBackendError(error instanceof Error ? error.message : 'Backend unavailable')
    }
  }, [])

  const fetchQueue = useCallback(async () => {
    const response = await fetch('/api/pulz/queue')
    if (response.status === 401) {
      setAuthRequired(true)
      return
    }
    const data = (await response.json()) as { items: QueueItem[] }
    setQueue(data.items)
  }, [])

  const fetchProposals = useCallback(async () => {
    const response = await fetch('/api/pulz/proposals')
    if (response.status === 401) {
      setAuthRequired(true)
      return
    }
    const data = (await response.json()) as { items: ProposalItem[] }
    setProposals(data.items)
  }, [])

  const fetchArtifacts = useCallback(async () => {
    const response = await fetch('/api/pulz/artifacts')
    if (response.status === 401) {
      setAuthRequired(true)
      return
    }
    const data = (await response.json()) as { items: ArtifactItem[] }
    setArtifacts(data.items)
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchQueue()
    fetchProposals()
    fetchArtifacts()
    fetchConfig()
    const interval = setInterval(() => {
      fetchStatus()
      fetchQueue()
      fetchProposals()
      fetchArtifacts()
      fetchConfig()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchArtifacts, fetchQueue, fetchStatus, fetchConfig, fetchProposals])

  useEffect(() => {
    const eventSource = new EventSource('/api/pulz/feed')
    eventSource.addEventListener('signal', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as FeedSignal
      setFeed((prev) => [payload, ...prev].slice(0, 50))
    })
    eventSource.addEventListener('heartbeat', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { running: boolean }
      if (payload.running !== status?.running) {
        fetchStatus()
        fetchQueue()
        fetchProposals()
        fetchArtifacts()
      }
    })
    const refreshOnExecution = () => {
      fetchProposals()
      fetchArtifacts()
    }
    eventSource.addEventListener('execution_queued', refreshOnExecution)
    eventSource.addEventListener('execution_started', refreshOnExecution)
    eventSource.addEventListener('execution_finished', refreshOnExecution)
    eventSource.addEventListener('execution_failed', refreshOnExecution)
    eventSource.addEventListener('execution_cancelled', refreshOnExecution)
    eventSource.onerror = () => {
      eventSource.close()
    }
    return () => eventSource.close()
  }, [fetchArtifacts, fetchQueue, fetchStatus, fetchProposals, status?.running])

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((item) => item !== source) : [...prev, source],
    )
  }

  const startMission = async () => {
    setMissionError(null)
    const response = await fetch('/api/pulz/mission/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_hours: durationHours,
        sources: selectedSources,
        rate_per_source_per_minute: rate,
        max_items: maxItems,
        authority_mode: authorityMode,
      }),
    })
    if (response.status === 401) {
      setAuthRequired(true)
      return
    }
    if (!response.ok) {
      const detail = await response.json()
      setMissionError(detail.detail ?? 'Failed to start mission')
      return
    }
    await fetchStatus()
  }

  const stopMission = async () => {
    setMissionError(null)
    const response = await fetch('/api/pulz/mission/stop', { method: 'POST' })
    if (response.status === 401) {
      setAuthRequired(true)
      return
    }
    await fetchStatus()
  }

  const approveProposal = async (id: string) => {
    await fetch(`/api/pulz/queue/${id}/approve`, { method: 'POST' })
    await fetchQueue()
    await fetchProposals()
    await fetchArtifacts()
  }

  const rejectProposal = async (id: string) => {
    await fetch(`/api/pulz/queue/${id}/reject`, { method: 'POST' })
    await fetchQueue()
    await fetchProposals()
  }

  const executeProposal = async (id: string, lane: string) => {
    await fetch(`/api/pulz/proposals/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane }),
    })
    await fetchProposals()
  }

  const updateExecutionLane = (id: string, lane: string) => {
    setExecutionLaneByProposal((prev) => ({ ...prev, [id]: lane }))
  }

  const tokenUsageLabel = status?.token_usage_available
    ? `${status.token_usage ?? 0}`
    : 'Token usage unavailable for this provider'

  const timeLeft = useMemo(() => {
    if (!status?.ends_at) {
      return 'N/A'
    }
    const end = new Date(status.ends_at).getTime()
    const now = Date.now()
    const diff = Math.max(0, Math.floor((end - now) / 1000))
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes}m ${seconds}s`
  }, [status?.ends_at])

  const statusBadge = status?.authority_mode ?? authorityMode

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Opportunity Engine</h1>
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
          </div>
        </div>

        {backendConnected === false && (
          <div className="p-4 mb-6 bg-red-900/40 border border-red-500 rounded-lg">
            <p className="text-red-200">
              Backend not reachable. Check OpenWebUI logs. {backendError ?? ''}
            </p>
          </div>
        )}

        {authRequired && (
          <div className="p-4 mb-6 bg-red-900/40 border border-red-500 rounded-lg">
            <p className="text-red-200">Login required to access the Opportunity Engine API.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 bg-[#131824] border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Mission Control</h2>
                <p className="text-gray-400 text-sm">
                  Configure a timed scan mission. Missions run only on demand.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  status?.running ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {status?.running ? 'RUNNING' : 'IDLE'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
              <div className="p-3 bg-[#0f1524] border border-gray-700 rounded-lg">
                <p className="text-gray-400">Mission timeline</p>
                <p>Start: {status?.started_at ?? 'Not started'}</p>
                <p>End: {status?.ends_at ?? 'Not scheduled'}</p>
                <p>Time left: {status?.running ? timeLeft : 'N/A'}</p>
                <p>
                  Execution switch:{' '}
                  <span className={status?.execution_blocked ? 'text-red-300' : 'text-green-300'}>
                    {status?.execution_blocked ? 'BLOCKED' : 'ENABLED'}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-[#0f1524] border border-gray-700 rounded-lg">
                <p className="text-gray-400">Backend</p>
                <p
                  className={
                    backendConnected === null
                      ? 'text-gray-300'
                      : backendConnected
                        ? 'text-green-300'
                        : 'text-red-300'
                  }
                >
                  {backendConnected === null
                    ? 'Checking...'
                    : backendConnected
                      ? 'Connected'
                      : 'Disconnected'}
                </p>
                <p className="text-gray-400 text-xs">
                  {backendConnected === null
                    ? 'Awaiting check'
                    : backendConnected
                      ? 'API responding'
                      : backendError ?? 'Backend unavailable'}
                </p>
              </div>
              <div className="p-3 bg-[#0f1524] border border-gray-700 rounded-lg">
                <p className="text-gray-400">Queue snapshot</p>
                <p>{queue.length} awaiting approval</p>
                <p>{artifacts.length} saved artifacts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Run for (hours)</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={durationHours}
                  onChange={(event) => setDurationHours(Number(event.target.value))}
                  className="w-full bg-[#0f1524] border border-gray-700 rounded-lg p-2"
                />
                <div className="flex gap-2 mt-2 text-xs text-gray-400">
                  {DURATIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDurationHours(option.value)}
                      className="px-2 py-1 bg-[#0f1524] border border-gray-700 rounded"
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Throughput</label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.5}
                  value={rate}
                  onChange={(event) => setRate(Number(event.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-400 mt-2">{rate} scan/min per source</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Max items</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={maxItems}
                  onChange={(event) => setMaxItems(Number(event.target.value))}
                  className="w-full bg-[#0f1524] border border-gray-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sources</label>
                <div className="space-y-2">
                  {SOURCE_OPTIONS.map((source) => (
                    <label key={source.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => toggleSource(source.id)}
                      />
                      <span>{source.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Authority mode</label>
                <select
                  className="w-full bg-[#0f1524] border border-gray-700 rounded-lg p-2"
                  value={authorityMode}
                  onChange={(event) => setAuthorityMode(event.target.value)}
                >
                  <option value="scan_only">Scan only</option>
                  <option value="draft_only">Draft only</option>
                  <option value="auto_draft_queue">Auto draft + queue</option>
                  <option value="execute_after_approval">Execute after approval</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  Current: <span className="text-blue-300">{statusBadge}</span>
                </p>
              </div>
            </div>

            {missionError && <p className="text-red-400 text-sm mb-3">{missionError}</p>}

            <div className="flex gap-3">
              <button
                onClick={startMission}
                disabled={status?.running || selectedSources.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                Run mission
              </button>
              <button
                onClick={stopMission}
                disabled={!status?.running}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                Stop mission
              </button>
              <div className="text-sm text-gray-400 flex items-center">
                Active sources: {sourceSummary.join(', ') || 'None selected'}
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#131824] border border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Live Mission Telemetry</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <p className="text-gray-400">Last scan</p>
                <p>{status?.last_scan ?? 'Awaiting mission start'}</p>
              </div>
              <div>
                <p className="text-gray-400">Items processed</p>
                <p>{status?.items_processed ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Items/min</p>
                <p>{status?.items_per_min ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Provider</p>
                <p>{status?.provider ?? 'heuristic-only'}</p>
              </div>
              <div>
                <p className="text-gray-400">Model calls</p>
                <p>{status?.model_calls ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Token usage</p>
                <p>{tokenUsageLabel}</p>
              </div>
              <div>
                <p className="text-gray-400">Last error</p>
                <p className="text-red-300">{status?.last_error ?? 'None'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-[#131824] border border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Live Feed</h2>
            {feed.length === 0 ? (
              <p className="text-gray-400">No events yet. Start a mission to begin scanning.</p>
            ) : (
              <div className="space-y-4">
                {feed.map((item, index) => (
                  <div key={`${item.signal.url}-${index}`} className="p-4 bg-[#0f1524] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-blue-300">{item.signal.source}</span>
                      <a
                        href={item.signal.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Open source
                      </a>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{item.signal.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{item.signal.body_excerpt}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-400">Why it matters</p>
                        <p>{item.scoring.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Feasibility</p>
                        <p>
                          {item.scoring.feasibility} · {item.scoring.estimated_build_time_minutes} min
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Price range</p>
                        <p>{item.scoring.suggested_price_range}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Next action</p>
                        <p>{item.scoring.recommended_next_action}</p>
                      </div>
                    </div>
                    {item.proposal && (
                      <div className="bg-[#131824] border border-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-400 mb-2">Draft proposal</p>
                        <p className="text-sm whitespace-pre-line">{item.proposal.message_template}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-[#131824] border border-gray-700 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Proposal Pipeline</h2>
              {proposals.length === 0 ? (
                <p className="text-gray-400">No proposals yet. Start a mission to begin drafting.</p>
              ) : (
                <div className="space-y-4">
                  {proposals.map((item) => {
                    const lane = executionLaneByProposal[item.id] ?? 'html'
                    const stateLabel =
                      item.status === 'approved'
                        ? 'Approved → Ready to execute'
                        : item.status === 'executing'
                          ? 'Approved → Executing'
                          : item.status === 'executed'
                            ? 'Approved → Executed'
                            : item.status === 'failed'
                              ? 'Approved → Failed'
                              : item.status === 'cancelled'
                                ? 'Approved → Cancelled'
                                : 'Draft → Queued'
                    return (
                      <div key={item.id} className="p-3 bg-[#0f1524] rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">{item.source}</div>
                        <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                        <p className="text-xs text-gray-400 mb-2">{item.proposal.problem_summary}</p>
                        <p className="text-xs text-blue-300 mb-2">{stateLabel}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          Authority: {item.execution_mode ?? 'manual'}
                          {item.execution_mode === 'auto_after_approval' &&
                            item.status === 'queued' && (
                              <span className="text-emerald-300 ml-2">(Auto-run after approval)</span>
                            )}
                        </p>
                        {item.status === 'queued' && (
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => approveProposal(item.id)}
                              className="px-3 py-1 text-xs bg-green-600 rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectProposal(item.id)}
                              className="px-3 py-1 text-xs bg-red-600 rounded"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {item.status === 'approved' && (
                          <div className="flex items-center gap-2 mb-2">
                            <select
                              value={lane}
                              onChange={(event) => updateExecutionLane(item.id, event.target.value)}
                              className="bg-[#0f1524] border border-gray-700 rounded px-2 py-1 text-xs"
                            >
                              <option value="html">HTML</option>
                              <option value="pdf">PDF</option>
                              <option value="doc">Doc</option>
                              <option value="site">Site</option>
                            </select>
                            <button
                              onClick={() => executeProposal(item.id, lane)}
                              className="px-3 py-1 text-xs bg-indigo-600 rounded"
                            >
                              Execute
                            </button>
                          </div>
                        )}
                        <a href={item.url} className="text-xs text-blue-400 hover:underline">
                          View source
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-[#131824] border border-gray-700 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Artifacts</h2>
              {artifacts.length === 0 ? (
                <p className="text-gray-400">Approved proposals appear here.</p>
              ) : (
                <div className="space-y-3">
                  {artifacts.map((item) => (
                    <div key={item.id} className="p-3 bg-[#0f1524] rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Saved {item.created_at}</p>
                      <p className="text-sm mb-2">{item.proposal.problem_summary}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.proposal.message_template)}
                        className="px-3 py-1 text-xs bg-blue-600 rounded"
                      >
                        Copy draft
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
