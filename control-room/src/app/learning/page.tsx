'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getIncidentStats, getAllIncidents, getOpenIncidents, seedIncidentLog, type IncidentEntry } from '@/learning/incidentLog'
import { DEPLOYMENT_VERIFICATION_CHECKS, getCheckSummary } from '@/learning/verificationChecklist'

export default function LearningPage() {
  const [stats, setStats] = useState(getIncidentStats())
  const [incidents, setIncidents] = useState<IncidentEntry[]>([])
  const [openIncidents, setOpenIncidents] = useState<IncidentEntry[]>([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    seedIncidentLog()
    const incidentsData = getAllIncidents()
    setIncidents(incidentsData)
    setOpenIncidents(getOpenIncidents())
  }, [])

  const hasOpenIncidents = openIncidents.length > 0

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Learning Library
          </h1>
          <p className="text-xl text-control-text-secondary max-w-3xl font-light leading-relaxed">
            Deployment incident log, verification checklist, and integrity monitoring.
            When something fails, we learn and prevent recurrence.
          </p>
        </motion.div>

        {/* Status Banner */}
        {hasOpenIncidents && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-4 bg-control-warning/10 border border-control-warning/30 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-control-warning mb-1">
                  {openIncidents.length} Open {openIncidents.length === 1 ? 'Incident' : 'Incidents'}
                </h3>
                <p className="text-xs text-control-text-secondary">
                  Open incidents require investigation before closing.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-text-primary mb-2">{stats.total}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Total Incidents
            </div>
          </div>
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-warning mb-2">{stats.open}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Open
            </div>
          </div>
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-success mb-2">{stats.resolved}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Resolved
            </div>
          </div>
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-accent mb-2">
              {stats.meanTimeToResolve.toFixed(1)}h
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Avg. Resolution Time
            </div>
          </div>
        </motion.div>

        {/* Two-Strike Verification Protocol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-3">
            <span className="text-control-accent">📋</span>
            Two-Strike Verification Protocol
          </h2>
          <div className="glass-panel-bright p-8">
            <p className="text-sm text-control-text-secondary mb-6 leading-relaxed">
              When a deployment claims success but actual behavior differs, PulZ must double-check
              before declaring victory. This protocol encodes systematic skepticism into the process.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-control-border/20 rounded-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider text-control-warning mb-3">
                  Strike 1: Log &amp; Identify
                </h3>
                <ul className="text-xs text-control-text-secondary space-y-2">
                  <li>• Log incident details to learning library</li>
                  <li>• Identify probable cause candidates</li>
                  <li>• Do not close until root cause confirmed</li>
                </ul>
              </div>
              <div className="p-6 bg-control-border/20 rounded-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider text-control-error mb-3">
                  Strike 2: Root Cause &amp; Prevention
                </h3>
                <ul className="text-xs text-control-text-secondary space-y-2">
                  <li>• Explicit root cause must be identified</li>
                  <li>• Prevention gate must be implemented</li>
                  <li>• Only close incident after verification</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Verification Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-3">
            <span className="text-control-accent">✅</span>
            Verification Checklist
          </h2>
          <div className="glass-panel-bright p-8">
            <div className="space-y-4">
              {DEPLOYMENT_VERIFICATION_CHECKS.map((check, index) => (
                <div key={check.id} className="flex items-start gap-4 p-4 bg-control-bg/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    check.severity === 'critical' ? 'bg-control-error' :
                    check.severity === 'high' ? 'bg-control-warning' :
                    'bg-control-accent'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-bold text-control-text-primary">{check.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        check.severity === 'critical' ? 'bg-control-error/20 text-control-error' :
                        check.severity === 'high' ? 'bg-control-warning/20 text-control-warning' :
                        'bg-control-accent/20 text-control-accent'
                      }`}>
                        {check.severity}
                      </span>
                    </div>
                    <p className="text-xs text-control-text-secondary">{check.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Deployment Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-3">
            <span className="text-control-accent">🔧</span>
            Current Deployment Mode
          </h2>
          <div className="glass-panel-bright p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-control-text-muted mb-2">
                  Base Path
                </h3>
                <p className="text-lg font-mono text-control-accent">
                  {process.env.NEXT_PUBLIC_BASE_PATH || '(empty)'}
                </p>
                <p className="text-xs text-control-text-secondary mt-1">
                  {process.env.NEXT_PUBLIC_BASE_PATH ? 'Repository path deployment' : 'Custom domain deployment'}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-control-text-muted mb-2">
                  Build Environment
                </h3>
                <p className="text-sm text-control-text-secondary">
                  Static export (Next.js output: &apos;export&apos;)
                </p>
                <p className="text-xs text-control-text-muted mt-1">
                  Deployed via GitHub Actions
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Incident Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-3">
            <span className="text-control-accent">📖</span>
            Incident Log
          </h2>
          {incidents.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <p className="text-sm text-control-text-muted">No incidents recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((entry, index) => (
                <div key={entry.incident.id} className="glass-panel-bright p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-control-text-muted">
                          {entry.incident.id}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          entry.incident.status === 'resolved' ? 'bg-control-success/20 text-control-success' :
                          entry.incident.status === 'investigating' ? 'bg-control-warning/20 text-control-warning' :
                          'bg-control-error/20 text-control-error'
                        }`}>
                          {entry.incident.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-control-text-primary mb-1">
                        {entry.incident.description}
                      </h3>
                      <p className="text-xs text-control-text-muted">
                        {new Date(entry.incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {entry.incident.probableCauses.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-control-text-muted mb-2">
                        Probable Causes
                      </h4>
                      <ul className="text-xs text-control-text-secondary space-y-1">
                        {entry.incident.probableCauses.map((cause, i) => (
                          <li key={i}>• {cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.resolution && (
                    <div className="p-4 bg-control-success/10 border border-control-success/30 rounded-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-control-success mb-2">
                        Resolution
                      </h4>
                      <p className="text-xs text-control-text-secondary mb-2">
                        <span className="font-bold">Root Cause:</span> {entry.resolution.rootCause}
                      </p>
                      <p className="text-xs text-control-text-secondary mb-2">
                        <span className="font-bold">Prevention Gate:</span> {entry.resolution.preventionGate}
                      </p>
                      <p className="text-[10px] text-control-text-muted">
                        Verified at {new Date(entry.resolution.verifiedAt).toLocaleString()} by {entry.resolution.verifiedBy}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
