'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

type FeedEvent = {
  id: string
  type: string
  receivedAt: string
  payload: Record<string, unknown>
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
  proposal_id?: string
  execution_id?: string | null
  proposal: {
    message_template: string
    suggested_price_range: string
    estimated_build_time_minutes: number
    solution_options: string[]
    problem_summary: string
  }
  kind?: string | null
  path?: string | null
  sha256?: string | null
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

type ExecutionItem = {
  id: string
  proposal_id: string
  mission_id?: string | null
  lane: string
  status: string
  started_at?: string | null
  finished_at?: string | null
  approved_by?: string | null
  inputs_json?: string | null
  outputs_json?: string | null
  logs_text?: string | null
  error?: string | null
  metrics_json?: string | null
}

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
    revenue_cents?: number | null
    roi?: number | null
    unrealized?: boolean
  }[]
  config: {
    cost_per_1m_tokens_usd: Record<string, number>
  }
}

type ModuleConfig = {
  id: string
  title: string
  description: string
  collapsed: boolean
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

const AUTHORITY_MODES = [
  { value: 'scan_only', label: 'Scan only' },
  { value: 'draft_only', label: 'Draft only' },
  { value: 'auto_draft_queue', label: 'Auto draft + queue' },
  { value: 'execute_after_approval', label: 'Execute after approval' },
]

const EXECUTION_LANES = [
  { id: 'html', label: 'HTML', enabled: true },
  { id: 'pdf', label: 'PDF', enabled: true },
  { id: 'doc', label: 'DOC', enabled: true },
  { id: 'site', label: 'SITE', enabled: true },
  { id: 'image', label: 'IMAGE', enabled: false },
  { id: 'video', label: 'VIDEO', enabled: false },
  { id: 'code', label: 'CODE', enabled: false },
]

const TAB_OPTIONS = ['Live Activity', 'Queue', 'Proposals', 'Executions', 'Artifacts'] as const

type TabOption = (typeof TAB_OPTIONS)[number]

type SeverityLevel = 'critical' | 'warning' | 'info'

const severityStyle: Record<SeverityLevel, string> = {
  critical: 'border-red-500/60 bg-red-900/30 text-red-100',
  warning: 'border-amber-500/60 bg-amber-900/20 text-amber-100',
  info: 'border-blue-500/40 bg-blue-900/20 text-blue-100',
}

const missionStateLabel = (
  status: MissionStatus | null,
  queueCount: number,
  executionCount: number,
): string => {
  if (!status?.running) return 'IDLE'
  if (status.execution_blocked) return 'BLOCKED'
  if (executionCount > 0) return 'EXECUTING'
  if (queueCount > 0) return 'QUEUED'
  if (status.authority_mode === 'draft_only') return 'DRAFTING'
  return 'SCANNING'
}

const getSeverityForEvent = (eventType: string): SeverityLevel => {
  if (eventType.includes('failed') || eventType.includes('cancelled')) return 'critical'
  if (eventType.includes('queued')) return 'warning'
  return 'info'
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return 'N/A'
  return `$${(value / 100).toFixed(2)}`
}

const formatTimestamp = (value?: string | null) => (value ? value.replace('T', ' ').replace('Z', ' UTC') : 'N/A')

const parseMetrics = (metricsJson?: string | null) => {
  if (!metricsJson) return null
  try {
    return JSON.parse(metricsJson) as Record<string, unknown>
  } catch {
    return null
  }
}

export default function PulzControlRoomPage() {
  const user = getPulzUser()
  const [status, setStatus] = useState<MissionStatus | null>(null)
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [proposals, setProposals] = useState<ProposalItem[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([])
  const [executions, setExecutions] = useState<ExecutionItem[]>([])
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null)
  const [durationHours, setDurationHours] = useState(1)
  const [rate, setRate] = useState(1)
  const [maxItems, setMaxItems] = useState(100)
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'reddit_smallbusiness',
    'rss_forhire',
  ])
  const [authorityMode, setAuthorityMode] = useState('auto_draft_queue')
  const [budgetCeiling, setBudgetCeiling] = useState(500)
  const [executionLaneByProposal, setExecutionLaneByProposal] = useState<Record<string, string>>({})
  const [executorEnabled, setExecutorEnabled] = useState<Record<string, boolean>>({
    html: true,
    pdf: true,
    doc: true,
    site: true,
  })
  const [modelLaneConfig, setModelLaneConfig] = useState<Record<string, string>>({})
  const [laneTokenLimit, setLaneTokenLimit] = useState<Record<string, number>>({})
  const [laneTemperature, setLaneTemperature] = useState<Record<string, number>>({})
  const [verificationModel, setVerificationModel] = useState('')
  const [approvalThreshold, setApprovalThreshold] = useState(2)
  const [autoRejectRule, setAutoRejectRule] = useState('')
  const [safetyLock, setSafetyLock] = useState(false)
  const [scrutinyMode, setScrutinyMode] = useState<'normal' | 'heavy'>('normal')
  const [scrutinyGate, setScrutinyGate] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<TabOption>('Live Activity')
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({})
  const [authRequired, setAuthRequired] = useState(false)
  const [missionError, setMissionError] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [memorySyncStatus, setMemorySyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [memorySyncError, setMemorySyncError] = useState<string | null>(null)
  const [lastMemorySync, setLastMemorySync] = useState<string | null>(null)
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)
  const [artifactPreview, setArtifactPreview] = useState<string | null>(null)
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig[]>([
    {
      id: 'mission-builder',
      title: 'Mission Builder',
      description: 'Configure scanning scope and authority overrides.',
      collapsed: false,
    },
    {
      id: 'model-orchestration',
      title: 'Model Orchestration',
      description: 'Control per-lane model, token limits, and verification.',
      collapsed: false,
    },
    {
      id: 'executor-control',
      title: 'Executor Control',
      description: 'Enable or block execution lanes.',
      collapsed: false,
    },
    {
      id: 'governance',
      title: 'Governance',
      description: 'Define approval thresholds, auto-reject rules, and safety locks.',
      collapsed: false,
    },
  ])
  const [draggingModule, setDraggingModule] = useState<string | null>(null)

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

  const fetchExecutions = useCallback(async () => {
    const response = await fetch('/api/pulz/executions')
    if (response.status === 401) {
      setAuthRequired(true)
      return
    }
    const data = (await response.json()) as { items: ExecutionItem[] }
    setExecutions(data.items)
  }, [])

  const fetchTelemetry = useCallback(async () => {
    const response = await fetch('/api/pulz/telemetry/summary')
    if (!response.ok) {
      return
    }
    const data = (await response.json()) as TelemetrySummary
    setTelemetry(data)
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchQueue()
    fetchProposals()
    fetchArtifacts()
    fetchExecutions()
    fetchTelemetry()
    fetchConfig()
    const interval = setInterval(() => {
      fetchStatus()
      fetchQueue()
      fetchProposals()
      fetchArtifacts()
      fetchExecutions()
      fetchTelemetry()
      fetchConfig()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchArtifacts, fetchQueue, fetchStatus, fetchConfig, fetchProposals, fetchExecutions, fetchTelemetry])

  useEffect(() => {
    const eventSource = new EventSource('/api/pulz/feed')
    const addEvent = (type: string, payload: Record<string, unknown>) => {
      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setFeedEvents((prev) => [{ id, type, receivedAt: new Date().toISOString(), payload }, ...prev].slice(0, 120))
    }
    eventSource.addEventListener('signal', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as FeedSignal
      addEvent('signal', payload as unknown as Record<string, unknown>)
    })
    eventSource.addEventListener('heartbeat', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { running: boolean }
      addEvent('heartbeat', payload as unknown as Record<string, unknown>)
      if (payload.running !== status?.running) {
        fetchStatus()
        fetchQueue()
        fetchProposals()
        fetchArtifacts()
        fetchExecutions()
      }
    })
    const refreshOnExecution = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent).data) as Record<string, unknown>
      addEvent((event as MessageEvent).type, payload)
      fetchProposals()
      fetchArtifacts()
      fetchExecutions()
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
  }, [fetchArtifacts, fetchQueue, fetchStatus, fetchProposals, fetchExecutions, status?.running])

  useEffect(() => {
    if (status?.authority_mode) {
      setAuthorityMode(status.authority_mode)
    }
  }, [status?.authority_mode])

  const toggleSource = (source: string) => {
    setSelectedSources((prev) => (prev.includes(source) ? prev.filter((item) => item !== source) : [...prev, source]))
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
        budget_ceiling_usd: budgetCeiling,
        scrutiny_mode: scrutinyMode,
        orchestration: {
          model_lane_config: modelLaneConfig,
          lane_token_limit: laneTokenLimit,
          lane_temperature: laneTemperature,
          verification_model: verificationModel,
        },
        governance: {
          approval_threshold: approvalThreshold,
          auto_reject_rule: autoRejectRule,
          safety_lock: safetyLock,
        },
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

  const killMission = async () => {
    await stopMission()
    const activeExecutions = executions.filter((execution) => !['succeeded', 'failed', 'cancelled'].includes(execution.status))
    await Promise.all(
      activeExecutions.map((execution) => fetch(`/api/pulz/executions/${execution.id}/cancel`, { method: 'POST' })),
    )
    await fetchExecutions()
  }

  const updateAuthorityMode = async (nextMode: string) => {
    setAuthorityMode(nextMode)
    if (!status?.mission_id) {
      return
    }
    const response = await fetch(`/api/pulz/missions/${status.mission_id}/authority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authority_mode: nextMode }),
    })
    if (!response.ok) {
      const detail = await response.json()
      setMissionError(detail.detail ?? 'Failed to update authority mode')
    }
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
    await fetchExecutions()
  }

  const updateExecutionLane = (id: string, lane: string) => {
    setExecutionLaneByProposal((prev) => ({ ...prev, [id]: lane }))
  }

  const toggleExecutor = (laneId: string, enabled: boolean) => {
    setExecutorEnabled((prev) => ({ ...prev, [laneId]: enabled }))
  }

  const updateModuleCollapse = (id: string) => {
    setModuleConfig((prev) => prev.map((module) => (module.id === id ? { ...module, collapsed: !module.collapsed } : module)))
  }

  const onDragStart = (id: string) => {
    setDraggingModule(id)
  }

  const onDropModule = (id: string) => {
    if (!draggingModule || draggingModule === id) return
    setModuleConfig((prev) => {
      const next = [...prev]
      const fromIndex = next.findIndex((module) => module.id === draggingModule)
      const toIndex = next.findIndex((module) => module.id === id)
      if (fromIndex === -1 || toIndex === -1) return prev
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setDraggingModule(null)
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

  const missionState = missionStateLabel(status, queue.length, executions.length)

  const tokensPerMinute = useMemo(() => {
    if (!telemetry?.tokens_over_time.length) return null
    const latest = telemetry.tokens_over_time[telemetry.tokens_over_time.length - 1]
    return Math.round(latest.tokens / 60)
  }, [telemetry])

  const errorRate = useMemo(() => {
    if (!executions.length) return 0
    const failed = executions.filter((execution) => execution.status === 'failed').length
    return Math.round((failed / executions.length) * 100)
  }, [executions])

  const activeExecutions = executions.filter((execution) => ['queued', 'running', 'executing'].includes(execution.status))

  const requestMemorySync = async () => {
    setMemorySyncStatus('syncing')
    setMemorySyncError(null)
    try {
      const response = await fetch('/api/pulz/memory/sync', { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Memory sync failed: ${response.status}`)
      }
      setMemorySyncStatus('success')
      setLastMemorySync(new Date().toISOString())
    } catch (error) {
      setMemorySyncStatus('error')
      setMemorySyncError(error instanceof Error ? error.message : 'Memory sync unavailable')
    }
  }

  const toggleEventExpanded = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const updateArtifactPreview = async (artifactId: string) => {
    setActiveArtifactId(artifactId)
    setArtifactPreview(null)
    const response = await fetch(`/api/pulz/artifacts/${artifactId}?format=text`)
    if (response.ok) {
      const text = await response.text()
      setArtifactPreview(text)
    }
  }

  const missionSummary = status
    ? `${status.items_processed ?? 0} items Â· ${status.items_per_min ?? 0} items/min`
    : 'Awaiting status'

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0b1020]/95 backdrop-blur">
        <div className="mx-auto max-w-[1800px] px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">PulZ Control Room</p>
              <h1 className="text-2xl font-semibold">Operator Command Surface</h1>
              <p className="text-sm text-slate-400">
                Operator:{' '}
                <span className="text-cyan-300">
                  {user ? `${user.display_name} (${user.role})` : 'Local operator'}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-full border border-slate-600 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.2em]">
                Mission State: <span className="text-emerald-300">{missionState}</span>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
                Authority: <span className="text-blue-300">{status?.authority_mode ?? authorityMode}</span>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
                Time left: <span className="text-slate-100">{status?.running ? timeLeft : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
              <p className="text-xs uppercase text-slate-400">Authority Mode</p>
              <select
                className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-2 text-sm"
                value={authorityMode}
                onChange={(event) => updateAuthorityMode(event.target.value)}
              >
                {AUTHORITY_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">Mission ID: {status?.mission_id ?? 'N/A'}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
              <p className="text-xs uppercase text-slate-400">Mission Controls</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={startMission}
                  disabled={status?.running || selectedSources.length === 0}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start
                </button>
                <button
                  onClick={stopMission}
                  disabled={!status?.running}
                  className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop
                </button>
                <button
                  onClick={killMission}
                  className="rounded-lg border border-red-500 bg-red-900/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-800"
                >
                  Kill Switch
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">{missionSummary}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
              <p className="text-xs uppercase text-slate-400">Scrutiny Mode</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm">{scrutinyMode === 'heavy' ? 'Heavy Scrutiny' : 'Normal'}</span>
                <button
                  onClick={() => setScrutinyMode(scrutinyMode === 'heavy' ? 'normal' : 'heavy')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    scrutinyMode === 'heavy' ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  {scrutinyMode === 'heavy' ? 'Enabled' : 'Standard'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {scrutinyMode === 'heavy'
                  ? 'Manual verification gates approvals and execution actions.'
                  : 'Standard review gates.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
              <p className="text-xs uppercase text-slate-400">Memory Sync</p>
              <button
                onClick={requestMemorySync}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200"
              >
                {memorySyncStatus === 'syncing' ? 'Syncingâ€¦' : 'Sync Memory'}
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Last sync: {lastMemorySync ? formatTimestamp(lastMemorySync) : 'Unavailable'}
              </p>
              {memorySyncStatus === 'error' && (
                <p className="mt-2 text-xs text-red-300">{memorySyncError ?? 'Memory sync unavailable'}</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
              <p className="text-xs uppercase text-slate-400">Token Telemetry</p>
              <p className="mt-2 text-lg font-semibold text-cyan-300">
                {tokensPerMinute !== null ? `${tokensPerMinute} tokens/min` : 'N/A'}
              </p>
              <label className="mt-3 block text-xs text-slate-400">Budget ceiling (USD)</label>
              <input
                type="range"
                min={50}
                max={2000}
                step={25}
                value={budgetCeiling}
                onChange={(event) => setBudgetCeiling(Number(event.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500">${budgetCeiling} cap Â· backend may enforce stricter limits</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-6 py-6">
        {backendConnected === false && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-900/40 p-4">
            <p className="text-red-200">
              Backend not reachable. Check OpenWebUI logs. {backendError ?? ''}
            </p>
          </div>
        )}

        {authRequired && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-900/40 p-4">
            <p className="text-red-200">Login required to access the PulZ API.</p>
          </div>
        )}

        {missionError && (
          <div className="mb-6 rounded-lg border border-amber-500/60 bg-amber-900/30 p-4">
            <p className="text-amber-100">{missionError}</p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 space-y-4 xl:col-span-3">
            {moduleConfig.map((module) => (
              <section
                key={module.id}
                draggable
                onDragStart={() => onDragStart(module.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDropModule(module.id)}
                className={`rounded-2xl border border-slate-800 bg-[#0f1426] p-4 ${
                  draggingModule === module.id ? 'opacity-70' : 'opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-slate-400">{module.title}</p>
                    <p className="text-sm text-slate-400">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-[10px] uppercase">
                      Drag
                    </span>
                    <button
                      onClick={() => updateModuleCollapse(module.id)}
                      className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-[10px] uppercase"
                    >
                      {module.collapsed ? 'Expand' : 'Collapse'}
                    </button>
                  </div>
                </div>

                {!module.collapsed && module.id === 'mission-builder' && (
                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <label className="text-xs text-slate-400">Duration (hours)</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={durationHours}
                        onChange={(event) => setDurationHours(Number(event.target.value))}
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-2"
                      />
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                        {DURATIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setDurationHours(option.value)}
                            className="rounded-md border border-slate-700 bg-[#0b1020] px-2 py-1"
                            type="button"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Sources</label>
                      <div className="mt-2 space-y-2">
                        {SOURCE_OPTIONS.map((source) => (
                          <label key={source.id} className="flex items-center gap-2 text-xs">
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400">Rate per source/min</label>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={0.5}
                          value={rate}
                          onChange={(event) => setRate(Number(event.target.value))}
                          className="mt-2 w-full"
                        />
                        <p className="text-xs text-slate-500">{rate} scan/min</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Max items</label>
                        <input
                          type="number"
                          min={10}
                          max={500}
                          value={maxItems}
                          onChange={(event) => setMaxItems(Number(event.target.value))}
                          className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Authority override</label>
                      <select
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-2 text-sm"
                        value={authorityMode}
                        onChange={(event) => updateAuthorityMode(event.target.value)}
                      >
                        {AUTHORITY_MODES.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={startMission}
                        disabled={status?.running || selectedSources.length === 0}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Start Mission
                      </button>
                      <button
                        onClick={stopMission}
                        disabled={!status?.running}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Stop Mission
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Active sources: {sourceSummary.join(', ') || 'None selected'}</p>
                  </div>
                )}

                {!module.collapsed && module.id === 'model-orchestration' && (
                  <div className="mt-4 space-y-4 text-sm">
                    {EXECUTION_LANES.filter((lane) => lane.enabled).map((lane) => (
                      <div key={lane.id} className="rounded-lg border border-slate-800 bg-[#0b1020] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase text-slate-400">{lane.label} lane</span>
                          <span className="text-[10px] text-emerald-300">Active</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400">Model</label>
                            <input
                              type="text"
                              value={modelLaneConfig[lane.id] ?? ''}
                              onChange={(event) =>
                                setModelLaneConfig((prev) => ({ ...prev, [lane.id]: event.target.value }))
                              }
                              className="mt-1 w-full rounded-md border border-slate-700 bg-[#05070f] p-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Token limit</label>
                            <input
                              type="number"
                              min={0}
                              value={laneTokenLimit[lane.id] ?? 0}
                              onChange={(event) =>
                                setLaneTokenLimit((prev) => ({ ...prev, [lane.id]: Number(event.target.value) }))
                              }
                              className="mt-1 w-full rounded-md border border-slate-700 bg-[#05070f] p-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Temperature</label>
                            <input
                              type="number"
                              min={0}
                              max={2}
                              step={0.1}
                              value={laneTemperature[lane.id] ?? 0}
                              onChange={(event) =>
                                setLaneTemperature((prev) => ({ ...prev, [lane.id]: Number(event.target.value) }))
                              }
                              className="mt-1 w-full rounded-md border border-slate-700 bg-[#05070f] p-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Reasoning depth</label>
                            <select
                              className="mt-1 w-full rounded-md border border-slate-700 bg-[#05070f] p-2 text-xs"
                            >
                              <option value="shallow">Shallow</option>
                              <option value="balanced">Balanced</option>
                              <option value="deep">Deep</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="rounded-lg border border-slate-800 bg-[#0b1020] p-3">
                      <label className="text-[10px] text-slate-400">Verification model slot</label>
                      <input
                        type="text"
                        value={verificationModel}
                        onChange={(event) => setVerificationModel(event.target.value)}
                        className="mt-2 w-full rounded-md border border-slate-700 bg-[#05070f] p-2 text-xs"
                      />
                      <p className="mt-2 text-[10px] text-slate-500">
                        Used when scrutiny mode requires multi-model verification.
                      </p>
                    </div>
                  </div>
                )}

                {!module.collapsed && module.id === 'executor-control' && (
                  <div className="mt-4 space-y-3 text-sm">
                    {EXECUTION_LANES.map((lane) => (
                      <div key={lane.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0b1020] p-3">
                        <div>
                          <p className="text-xs uppercase text-slate-400">{lane.label}</p>
                          <p className="text-[10px] text-slate-500">
                            {lane.enabled ? 'Lane available' : 'Unavailable on backend'}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={executorEnabled[lane.id] ?? lane.enabled}
                          onChange={(event) => toggleExecutor(lane.id, event.target.checked)}
                          disabled={!lane.enabled}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {!module.collapsed && module.id === 'governance' && (
                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <label className="text-xs text-slate-400">Approval threshold</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={approvalThreshold}
                        onChange={(event) => setApprovalThreshold(Number(event.target.value))}
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Auto-reject rules</label>
                      <textarea
                        value={autoRejectRule}
                        onChange={(event) => setAutoRejectRule(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-2 text-xs"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Cost ceiling (USD)</label>
                      <input
                        type="number"
                        min={0}
                        value={budgetCeiling}
                        onChange={(event) => setBudgetCeiling(Number(event.target.value))}
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1020] p-2"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0b1020] p-3">
                      <div>
                        <p className="text-xs uppercase text-slate-400">Safety lock</p>
                        <p className="text-[10px] text-slate-500">Stops execution when enabled.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={safetyLock}
                        onChange={(event) => setSafetyLock(event.target.checked)}
                      />
                    </div>
                  </div>
                )}
              </section>
            ))}
          </aside>

          <section className="col-span-12 xl:col-span-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0f1426] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs uppercase text-slate-400">Live System State</p>
                  <h2 className="text-lg font-semibold">Control Canvas</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAB_OPTIONS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        activeTab === tab ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'Live Activity' && (
                <div className="mt-4 space-y-4">
                  {feedEvents.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
                      No events yet. Start a mission to begin scanning.
                    </div>
                  ) : (
                    feedEvents.map((event) => {
                      const severity = getSeverityForEvent(event.type)
                      const isExpanded = expandedEvents[event.id]
                      const signal = event.type === 'signal' ? (event.payload as unknown as FeedSignal) : null
                      return (
                        <div
                          key={event.id}
                          className={`rounded-xl border p-4 ${severityStyle[severity]}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em]">{event.type}</p>
                              <p className="text-xs text-slate-300">{formatTimestamp(event.receivedAt)}</p>
                            </div>
                            <button
                              onClick={() => toggleEventExpanded(event.id)}
                              className="rounded-full border border-slate-600 px-3 py-1 text-xs"
                            >
                              {isExpanded ? 'Hide details' : 'Expand'}
                            </button>
                          </div>
                          {signal && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-cyan-300">{signal.signal.source}</span>
                                <a
                                  href={signal.signal.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-cyan-200 hover:underline"
                                >
                                  Open source
                                </a>
                              </div>
                              <h3 className="mt-2 text-lg font-semibold text-white">{signal.signal.title}</h3>
                              <p className="text-sm text-slate-200">{signal.signal.body_excerpt}</p>
                              <div className="mt-3 grid gap-3 text-xs text-slate-200 sm:grid-cols-2">
                                <div>
                                  <p className="text-[10px] uppercase text-slate-400">Category</p>
                                  <p>{signal.scoring.category}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-slate-400">Feasibility</p>
                                  <p>
                                    {signal.scoring.feasibility} Â· {signal.scoring.estimated_build_time_minutes} min
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-slate-400">Price Range</p>
                                  <p>{signal.scoring.suggested_price_range}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-slate-400">Next Action</p>
                                  <p>{signal.scoring.recommended_next_action}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {isExpanded && (
                            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-slate-200">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {activeTab === 'Queue' && (
                <div className="mt-4 space-y-4">
                  {queue.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
                      Queue is clear. Awaiting proposals.
                    </div>
                  ) : (
                    queue.map((item) => {
                      const buildTime = item.proposal.estimated_build_time_minutes
                      const riskLevel = buildTime > 120 ? 'High' : buildTime > 60 ? 'Medium' : 'Low'
                      const scrutinyRequired = scrutinyMode === 'heavy' && !scrutinyGate[item.id]
                      return (
                        <div key={item.id} className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-400">{item.source}</p>
                              <h3 className="text-lg font-semibold">{item.title}</h3>
                              <p className="text-xs text-slate-400">{item.proposal.problem_summary}</p>
                            </div>
                            <div className="text-xs text-slate-300">Queued {formatTimestamp(item.created_at)}</div>
                          </div>
                          <div className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Risk</p>
                              <p>{riskLevel}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Build time</p>
                              <p>{buildTime} min</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Suggested price</p>
                              <p>{item.proposal.suggested_price_range}</p>
                            </div>
                          </div>
                          {scrutinyMode === 'heavy' && (
                            <label className="mt-3 flex items-center gap-2 text-xs text-purple-200">
                              <input
                                type="checkbox"
                                checked={scrutinyGate[item.id] ?? false}
                                onChange={(event) =>
                                  setScrutinyGate((prev) => ({ ...prev, [item.id]: event.target.checked }))
                                }
                              />
                              Scrutiny verified
                            </label>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => approveProposal(item.id)}
                              disabled={scrutinyRequired}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectProposal(item.id)}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                            >
                              Reject
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                            >
                              View Source
                            </a>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {activeTab === 'Proposals' && (
                <div className="mt-4 space-y-4">
                  {proposals.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
                      No proposals created yet.
                    </div>
                  ) : (
                    proposals.map((item) => {
                      const lane = executionLaneByProposal[item.id] ?? 'html'
                      const allowExecute = executorEnabled[lane]
                      const scrutinyRequired = scrutinyMode === 'heavy' && !scrutinyGate[item.id]
                      return (
                        <div key={item.id} className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-400">{item.source}</p>
                              <h3 className="text-lg font-semibold">{item.title}</h3>
                              <p className="text-xs text-slate-400">{item.proposal.problem_summary}</p>
                            </div>
                            <div className="text-xs text-slate-300">Status: {item.status}</div>
                          </div>
                          <div className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-4">
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Created</p>
                              <p>{formatTimestamp(item.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Approved</p>
                              <p>{formatTimestamp(item.approved_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Executing</p>
                              <p>{formatTimestamp(item.executing_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Executed</p>
                              <p>{formatTimestamp(item.executed_at)}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span>Authority: {item.execution_mode ?? 'manual'}</span>
                            <span>Estimated revenue: {formatCurrency(item.estimated_revenue_cents)}</span>
                            <span>Realized revenue: {formatCurrency(item.realized_revenue_cents)}</span>
                          </div>
                          {item.status === 'approved' && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <select
                                value={lane}
                                onChange={(event) => updateExecutionLane(item.id, event.target.value)}
                                className="rounded-md border border-slate-700 bg-[#0b1020] px-2 py-1 text-xs"
                              >
                                {EXECUTION_LANES.filter((laneItem) => laneItem.enabled).map((laneItem) => (
                                  <option key={laneItem.id} value={laneItem.id}>
                                    {laneItem.label}
                                  </option>
                                ))}
                              </select>
                              {scrutinyMode === 'heavy' && (
                                <label className="flex items-center gap-2 text-xs text-purple-200">
                                  <input
                                    type="checkbox"
                                    checked={scrutinyGate[item.id] ?? false}
                                    onChange={(event) =>
                                      setScrutinyGate((prev) => ({ ...prev, [item.id]: event.target.checked }))
                                    }
                                  />
                                  Scrutiny verified
                                </label>
                              )}
                              <button
                                onClick={() => executeProposal(item.id, lane)}
                                disabled={!allowExecute || scrutinyRequired || safetyLock}
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Execute
                              </button>
                              {!allowExecute && (
                                <span className="text-xs text-amber-200">Lane disabled</span>
                              )}
                              {safetyLock && <span className="text-xs text-red-200">Safety lock enabled</span>}
                            </div>
                          )}
                          <a href={item.url} className="mt-3 inline-block text-xs text-cyan-300 hover:underline">
                            View source
                          </a>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {activeTab === 'Executions' && (
                <div className="mt-4 space-y-4">
                  {executions.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
                      No executions yet.
                    </div>
                  ) : (
                    executions.map((execution) => {
                      const metrics = parseMetrics(execution.metrics_json)
                      return (
                        <div key={execution.id} className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-400">Lane: {execution.lane.toUpperCase()}</p>
                              <h3 className="text-lg font-semibold">Execution {execution.id}</h3>
                              <p className="text-xs text-slate-400">Proposal: {execution.proposal_id}</p>
                            </div>
                            <div className="text-xs text-slate-300">Status: {execution.status}</div>
                          </div>
                          <div className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-4">
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Started</p>
                              <p>{formatTimestamp(execution.started_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Finished</p>
                              <p>{formatTimestamp(execution.finished_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Approved by</p>
                              <p>{execution.approved_by ?? 'System'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400">Tokens used</p>
                              <p>{(typeof metrics?.tokens === 'number') ? metrics.tokens.toLocaleString() : (metrics?.tokens ? JSON.stringify(metrics.tokens) : 'N/A')}</p>
                            </div>
                          </div>
                          {execution.error && (
                            <p className="mt-3 text-xs text-red-300">Error: {execution.error}</p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {activeTab === 'Artifacts' && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-4">
                    {artifacts.length === 0 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
                        No artifacts yet.
                      </div>
                    ) : (
                      artifacts.map((artifact) => (
                        <button
                          key={artifact.id}
                          onClick={() => updateArtifactPreview(artifact.id)}
                          className={`w-full rounded-xl border p-4 text-left ${
                            activeArtifactId === artifact.id
                              ? 'border-cyan-500 bg-cyan-900/20'
                              : 'border-slate-800 bg-[#11162a]'
                          }`}
                        >
                          <p className="text-xs text-slate-400">{formatTimestamp(artifact.created_at)}</p>
                          <h3 className="mt-2 text-sm font-semibold">{artifact.proposal.problem_summary}</h3>
                          <p className="mt-2 text-xs text-slate-400">Kind: {artifact.kind ?? 'Unknown'}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#11162a] p-4">
                    {activeArtifactId ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-slate-400">Artifact {activeArtifactId}</p>
                          <a
                            href={`/api/pulz/artifacts/${activeArtifactId}?format=download`}
                            className="rounded-md border border-slate-700 px-3 py-1 text-xs"
                          >
                            Download
                          </a>
                        </div>
                        {artifactPreview ? (
                          <pre className="max-h-[320px] overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-200">
                            {artifactPreview}
                          </pre>
                        ) : (
                          <p className="text-xs text-slate-400">Select an artifact to preview.</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Select an artifact to preview content.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="col-span-12 space-y-4 xl:col-span-3">
            <section className="rounded-2xl border border-slate-800 bg-[#0f1426] p-4">
              <p className="text-xs uppercase text-slate-400">Telemetry & Trust</p>
              <h2 className="text-lg font-semibold">System Health</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase text-slate-400">Token usage</p>
                  <p>{telemetry ? telemetry.total_tokens : 0} total tokens</p>
                  <p className="text-xs text-slate-500">Provider: {status?.provider ?? 'default'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Cost estimates</p>
                  <p>${telemetry?.total_cost_usd ?? 0} total</p>
                  <p className="text-xs text-slate-500">Per execution: ${telemetry?.cost_per_execution ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Error rate</p>
                  <p>{errorRate}% execution failures</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Verification status</p>
                  <p>{scrutinyMode === 'heavy' ? 'Heavy scrutiny active' : 'Normal review'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Authority blocks</p>
                  <p>{status?.execution_blocked ? 'Execution blocked' : 'No blocks'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Last memory sync</p>
                  <p>{lastMemorySync ? formatTimestamp(lastMemorySync) : 'Unavailable'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-[#0f1426] p-4">
              <p className="text-xs uppercase text-slate-400">Execution Pulse</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Active</span>
                  <span>{activeExecutions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Queued approvals</span>
                  <span>{queue.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Artifacts stored</span>
                  <span>{artifacts.length}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-[#0f1426] p-4">
              <p className="text-xs uppercase text-slate-400">Operational Snapshot</p>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase text-slate-400">Last scan</p>
                  <p>{status?.last_scan ?? 'Awaiting mission start'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Items processed</p>
                  <p>{status?.items_processed ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Items per minute</p>
                  <p>{status?.items_per_min ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Model calls</p>
                  <p>{status?.model_calls ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Token usage</p>
                  <p>{tokenUsageLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Last error</p>
                  <p className="text-red-300">{status?.last_error ?? 'None'}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

