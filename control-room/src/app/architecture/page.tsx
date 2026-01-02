'use client'

import { motion } from 'framer-motion'
import PipelineFlow from '@/components/PipelineFlow'
import SystemMap from '@/components/SystemMap'

const pipelineStages = [
  {
    stage: 'Input',
    description: 'Multiple ingestion sources',
    details: ['Email (IMAP/Gmail)', 'Quote forms', 'Tender feeds', 'Manual conversation', 'Repo webhooks'],
  },
  {
    stage: 'Normalize',
    description: 'Convert to standard objects',
    details: ['QuoteRequest', 'TenderOpportunity', 'WebsiteTask', 'VendorEmail', 'DecisionRequest'],
  },
  {
    stage: 'Plan',
    description: 'Generate constrained strategies',
    details: ['2-4 strategy options (not 25)', 'Predicted cost/time/risk', 'Choose best under limits'],
  },
  {
    stage: 'Execute',
    description: 'Run with hard boundaries',
    details: ['Tool calls budgeted', 'Circuit breakers active', 'Token/cost/time limits'],
  },
  {
    stage: 'Validate',
    description: 'Four-gate validation',
    details: ['Schema validation', 'Evidence checking', 'Consistency verification', 'Consensus critique'],
  },
  {
    stage: 'Store',
    description: 'Memory and audit trail',
    details: ['What worked/failed', 'Citations & evidence', 'Learned patterns', 'Cost & time data'],
  },
  {
    stage: 'Brief',
    description: 'Decision-ready output',
    details: ['What changed', 'What matters today', 'Decisions needed', 'Queued actions', 'Risks & opportunities'],
  },
]

export default function ArchitecturePage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <SystemMap />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Architecture
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            The Input → Brief pipeline ensures every piece of information flows through
            validation, consensus, and human approval gates before becoming action.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-control-accent">
              The Pipeline
            </h2>
            <div className="text-[10px] font-mono text-control-text-muted uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Auditability: High
            </div>
          </div>
          <PipelineFlow />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Stage Details
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelineStages.map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="glass-panel-bright p-6 flex flex-col"
              >
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-control-accent/20 flex items-center justify-center mr-3 border border-control-accent/30">
                    <span className="text-control-accent font-bold text-sm">{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-control-text-primary">
                    {stage.stage}
                  </h3>
                </div>
                <p className="text-control-text-secondary text-sm mb-4 min-h-[2.5rem]">
                  {stage.description}
                </p>
                <ul className="space-y-1.5 mt-auto">
                  {stage.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start text-[11px]">
                      <span className="text-control-accent mr-2 opacity-50">→</span>
                      <span className="text-control-text-muted leading-tight">{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel-bright p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 14H11V9H13V14M13 18H11V16H13V18M1 21H23L12 2L1 21Z" />
             </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-control-accent">
            Circuit Breakers
          </h2>
          <p className="text-control-text-secondary mb-8 leading-relaxed max-w-2xl text-sm">
            Hard limits prevent runaway behavior. When a circuit breaker trips,
            PulZ stops and reports what happened, what it was trying to do, and what it needs.
            No silent failures. No hidden costs.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { limit: 'Max AI Calls', value: 'Per task' },
              { limit: 'Max Tokens', value: 'Per task' },
              { limit: 'Max Cost', value: 'Per task' },
              { limit: 'Timeout', value: 'Per operation' },
              { limit: 'Loop Detection', value: 'Pattern match' },
              { limit: 'Tool Failures', value: 'Consecutive' },
            ].map((breaker, index) => (
              <motion.div
                key={breaker.limit}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-panel p-4 text-center border-red-500/10 hover:border-red-500/30 transition-colors"
              >
                <div className="text-control-error font-bold text-xs mb-1">
                  {breaker.limit}
                </div>
                <div className="text-control-text-muted text-[10px] uppercase tracking-tighter">
                  {breaker.value}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
