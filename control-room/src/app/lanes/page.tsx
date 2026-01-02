'use client'

import { motion } from 'framer-motion'
import LaneFlow from '@/components/LaneFlow'
import SystemMap from '@/components/SystemMap'

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
        <SystemMap />

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
            Operational Lanes
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {lanes.map((lane, index) => (
              <motion.div
                key={lane.name}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6 flex flex-col"
              >
                <div className="flex items-center mb-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mr-4 border border-white/5 shadow-inner"
                    style={{ backgroundColor: `${lane.color}15` }}
                  >
                    <span className="text-2xl">{lane.icon}</span>
                  </div>
                  <div>
                    <h3
                      className="text-2xl font-bold"
                      style={{ color: lane.color }}
                    >
                      {lane.name}
                    </h3>
                    <p className="text-[10px] font-bold text-control-text-muted uppercase tracking-widest mt-1">
                      Active Channel
                    </p>
                  </div>
                </div>

                <div className="mb-6 flex-grow">
                   <h4 className="text-[10px] font-bold text-control-accent mb-3 uppercase tracking-widest opacity-70">
                    Automation Focus
                  </h4>
                  <p className="text-sm text-control-text-secondary leading-relaxed">
                    {lane.automation}
                  </p>
                </div>

                <div className="glass-panel p-4 bg-black/20 border-white/5">
                  <h4 className="text-[10px] font-bold text-control-accent mb-4 uppercase tracking-widest opacity-70">
                    Process Flow
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {lane.flow.map((step, idx) => (
                      <div key={idx} className="flex items-center">
                        <span className="text-[10px] text-control-text-muted bg-white/5 px-2 py-1 rounded border border-white/5">
                          {step}
                        </span>
                        {idx < lane.flow.length - 1 && (
                          <span className="text-control-accent/40 mx-1 text-[10px]">→</span>
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
          className="glass-panel-bright p-8 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-control-accent/5 rounded-full blur-3xl" />
          <h2 className="text-2xl font-bold mb-6 text-control-accent">
            Morning Brief Integration
          </h2>
          <p className="text-control-text-secondary mb-8 leading-relaxed max-w-2xl text-sm">
            All lanes feed into your morning brief. PulZ prepares decision-ready options, 
            not just data. You approve, adjust, or reject.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'New Items', desc: 'Quotes, emails, tenders arrived' },
              { label: 'Actions Needed', desc: 'Decisions requiring approval' },
              { label: 'Auto-Processed', desc: 'Handled automatically' },
              { label: 'Risks & Flags', desc: 'Anomalies and conflicts' },
              { label: 'Opportunities', desc: 'Revenue potential' },
              { label: 'Queue Status', desc: 'Backlog and capacity' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-panel p-4 border-white/5"
              >
                <div className="text-xs font-bold text-control-accent mb-1 uppercase tracking-tighter">
                  {item.label}
                </div>
                <div className="text-[10px] text-control-text-muted leading-tight">
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
