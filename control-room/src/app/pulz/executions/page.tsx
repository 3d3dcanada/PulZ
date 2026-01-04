'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

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

type ExecutionArtifact = {
  id: string
  kind: string
  path?: string | null
  sha256?: string | null
  created_at: string
}

type ExecutionDetailResponse = {
  execution: ExecutionItem
  artifacts: ExecutionArtifact[]
}

function parseJson<T>(value?: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function formatElapsed(started?: string | null, finished?: string | null): string {
  if (!started) return 'N/A'
  const start = new Date(started).getTime()
  const end = finished ? new Date(finished).getTime() : Date.now()
  const diff = Math.max(0, Math.floor((end - start) / 1000))
  const minutes = Math.floor(diff / 60)
  const seconds = diff % 60
  return `${minutes}m ${seconds}s`
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<ExecutionItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ExecutionDetailResponse | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  async function loadExecutions() {
    const response = await fetch('/api/pulz/executions')
    const data = (await response.json()) as { items: ExecutionItem[] }
    setExecutions(data.items)
    if (!selectedId && data.items.length > 0) {
      setSelectedId(data.items[0].id)
    }
  }

  async function loadExecutionDetail(id: string) {
    const response = await fetch(`/api/pulz/executions/${id}`)
    const data = (await response.json()) as ExecutionDetailResponse
    setDetail(data)
    const initialLogs = data.execution.logs_text?.split('\n').filter(Boolean) ?? []
    setLogs(initialLogs)
  }

  async function cancelExecution(id: string) {
    await fetch(`/api/pulz/executions/${id}/cancel`, { method: 'POST' })
    await loadExecutions()
    await loadExecutionDetail(id)
  }

  useEffect(() => {
    loadExecutions()
    const interval = setInterval(loadExecutions, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    loadExecutionDetail(selectedId)
  }, [selectedId])

  useEffect(() => {
    const eventSource = new EventSource('/api/pulz/feed')
    eventSource.addEventListener('execution_log', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as {
        execution_id: string
        payload: { message?: string }
      }
      if (payload.execution_id === selectedId && payload.payload?.message) {
        setLogs((prev) => [...prev, payload.payload.message ?? ''])
      }
    })
    eventSource.addEventListener('execution_progress', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as {
        execution_id: string
        payload: { message?: string }
      }
      if (payload.execution_id === selectedId && payload.payload?.message) {
        setLogs((prev) => [...prev, payload.payload.message ?? ''])
      }
    })
    eventSource.addEventListener('execution_finished', () => loadExecutions())
    eventSource.addEventListener('execution_failed', () => loadExecutions())
    eventSource.addEventListener('execution_cancelled', () => loadExecutions())
    eventSource.onerror = () => eventSource.close()
    return () => eventSource.close()
  }, [selectedId])

  const selectedExecution = detail?.execution
  const outputs = useMemo(() => parseJson<Record<string, string>>(selectedExecution?.outputs_json), [selectedExecution])
  const metrics = useMemo(() => parseJson<Record<string, unknown>>(selectedExecution?.metrics_json), [selectedExecution])

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Execution Panel</h1>
            <p className="text-gray-400">Track post-approval execution runs, logs, and artifacts.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/pulz" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
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
              href="/pulz/telemetry"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition"
            >
              Telemetry
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#131824] border border-gray-700 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-semibold">Execution Queue</h2>
            {executions.length === 0 ? (
              <p className="text-gray-400 text-sm">No executions yet.</p>
            ) : (
              executions.map((execution) => (
                <button
                  key={execution.id}
                  onClick={() => setSelectedId(execution.id)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    execution.id === selectedId
                      ? 'border-blue-500 bg-[#0f1524]'
                      : 'border-gray-700 bg-[#0a0e1a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{execution.lane.toUpperCase()}</span>
                    <span className="text-xs text-gray-400">{execution.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Started: {execution.started_at ?? 'N/A'}</p>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-2 bg-[#131824] border border-gray-700 rounded-lg p-6">
            {!detail && <p className="text-gray-400">Select an execution to view details.</p>}
            {detail && selectedExecution && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Execution Details</h2>
                  <p className="text-sm text-gray-400">
                    State: {selectedExecution.status} · Lane: {selectedExecution.lane.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-400">
                    Approved → Executing ({selectedExecution.lane.toUpperCase()}) → {selectedExecution.status}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-[#0f1524] border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Elapsed</p>
                    <p>{formatElapsed(selectedExecution.started_at, selectedExecution.finished_at)}</p>
                  </div>
                  <div className="bg-[#0f1524] border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Proposal</p>
                    <p>{selectedExecution.proposal_id}</p>
                  </div>
                  <div className="bg-[#0f1524] border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Mission</p>
                    <p>{selectedExecution.mission_id ?? 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-[#0f1524] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">Artifacts</h3>
                  {detail.artifacts.length === 0 ? (
                    <p className="text-xs text-gray-400">No artifacts yet.</p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {detail.artifacts.map((artifact) => (
                        <li key={artifact.id} className="flex items-center justify-between">
                          <span>
                            {artifact.kind.toUpperCase()} · {artifact.created_at}
                          </span>
                          <a
                            href={`/api/pulz/artifacts/${artifact.id}?format=download`}
                            className="text-blue-400 hover:underline"
                          >
                            Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-[#0f1524] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">Metrics</h3>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(metrics ?? outputs ?? {}, null, 2)}
                  </pre>
                </div>

                <div className="bg-[#0f1524] border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">Live Logs</h3>
                  <div className="max-h-64 overflow-y-auto text-xs text-gray-300 whitespace-pre-wrap">
                    {logs.length === 0 ? 'No logs yet.' : logs.join('\n')}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => cancelExecution(selectedExecution.id)}
                    disabled={selectedExecution.status !== 'running'}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                  >
                    Cancel execution
                  </button>
                  {selectedExecution.error && (
                    <p className="text-sm text-red-400">Error: {selectedExecution.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
