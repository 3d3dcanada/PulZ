'use client'

import { motion } from 'framer-motion'
import LaneFlow from '@/components/LaneFlow'

const lanes = [
  {
    name: 'Quote Lane',
    icon: '💰',
    color: '#3b82f6',
    flow: ['Customer submits quote', 'Parse specs & materials', 'Route to qualified maker', 'Credit calculation', 'Approval & production'],
    automation: 'Specs validated, maker matched by capability, credit transfer tracked',
  },
  {
    name: 'Email Lane',
    icon: '📧',
    color: '#8b5cf6',
    flow: ['Email arrives', 'Parse intent & priority', 'Extract actions', 'Queue for morning brief', 'User reviews & approves'],
    automation: 'Spam filtered, vendor emails tagged, urgent items flagged',
  },
  {
    name: 'Tender Lane',
    icon: '📋',
    color: '#06b6d4',
    flow: ['Tender feed ingested', 'Screen against criteria', 'Score opportunity', 'Generate decision brief', 'User accept/reject'],
    automation: 'Keyword matching, budget validation, timeline feasibility',
  },
  {
    name: 'Website Lane',
    icon: '🌐',
    color: '#10b981',
    flow: ['Backlog item created', 'Task prioritized', 'Implementation via Claude/Lovable', 'PR opened', 'Review & merge'],
    automation: 'Code generation, test running, deployment automation',
  },
]

export default function LanesPage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Business Lanes
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            PulZ processes real business operations through structured lanes. Each lane
            has its own ingestion, validation, and approval workflow.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Quote Lane (3D3D Example)
          </h2>
          <LaneFlow />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            All Lanes
          </h2>
          <div className="space-y-6">
            {lanes.map((lane, index) => (
              <motion.div
                key={lane.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <div className="flex items-start mb-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center mr-6 flex-shrink-0"
                    style={{ backgroundColor: `${lane.color}20` }}
                  >
                    <span className="text-3xl">{lane.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <h3
                      className="text-2xl font-bold mb-2"
                      style={{ color: lane.color }}
                    >
                      {lane.name}
                    </h3>
                    <p className="text-control-text-secondary mb-4">
                      <span className="font-semibold">Automation: </span>
                      {lane.automation}
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-4 bg-control-bg/40">
                  <h4 className="text-sm font-semibold text-control-accent mb-3">
                    FLOW
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {lane.flow.map((step, idx) => (
                      <div key={idx} className="flex items-center">
                        <span className="glass-panel px-3 py-1 text-sm text-control-text-muted">
                          {step}
                        </span>
                        {idx < lane.flow.length - 1 && (
                          <span className="text-control-accent mx-2">→</span>
                        )}
                      </div>
                    ))}
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
          <h2 className="text-2xl font-bold mb-6 text-control-accent">
            Morning Brief Integration
          </h2>
          <p className="text-control-text-secondary mb-6 leading-relaxed">
            All lanes feed into your morning brief. You see:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: 'New Items', desc: 'Quotes, emails, tenders arrived overnight' },
              { label: 'Actions Needed', desc: 'Decisions that require your approval' },
              { label: 'Auto-Processed', desc: 'What was handled automatically' },
              { label: 'Risks & Flags', desc: 'Anomalies, conflicts, urgent items' },
              { label: 'Opportunities', desc: 'Revenue potential, high-value leads' },
              { label: 'Queue Status', desc: 'Backlog size, maker capacity, pending tasks' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-panel p-4"
              >
                <div className="text-control-accent font-semibold mb-2">
                  {item.label}
                </div>
                <div className="text-control-text-muted text-sm">
                  {item.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
