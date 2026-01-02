'use client'

import { motion } from 'framer-motion'
import PipelineFlow from '@/components/PipelineFlow'

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
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            The Pipeline
          </h2>
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
          <div className="space-y-6">
            {pipelineStages.map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-control-accent/20 flex items-center justify-center mr-4">
                    <span className="text-control-accent font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-2 text-control-text-primary">
                      {stage.stage}
                    </h3>
                    <p className="text-control-text-secondary mb-4">
                      {stage.description}
                    </p>
                    <ul className="space-y-2">
                      {stage.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <span className="text-control-accent mr-2">→</span>
                          <span className="text-control-text-muted">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel-bright p-8"
        >
          <h2 className="text-2xl font-bold mb-4 text-control-accent">
            Circuit Breakers
          </h2>
          <p className="text-control-text-secondary mb-6 leading-relaxed">
            Hard limits prevent runaway behavior. When a circuit breaker trips,
            PulZ stops and reports what happened, what it was trying to do, and what it needs.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
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
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-panel p-4 text-center"
              >
                <div className="text-control-error font-bold text-sm mb-1">
                  {breaker.limit}
                </div>
                <div className="text-control-text-muted text-xs">
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
