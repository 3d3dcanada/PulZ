'use client'

import { motion } from 'framer-motion'
import ConsensusVisualizer from '@/components/ConsensusVisualizer'
import SystemMap from '@/components/SystemMap'

const scenarios = [
  {
    title: 'Full Agreement',
    description: 'All models agree on key points',
    outcome: 'Confidence boost, proceed with plan',
    models: [
      { name: 'Claude', position: 'Approve quote at $450' },
      { name: 'GPT-4', position: 'Approve quote at $450' },
      { name: 'Gemini', position: 'Approve quote at $450' },
    ],
    result: 'CONSENSUS → Confidence: 95%',
    color: 'text-control-success',
  },
  {
    title: 'Minor Disagreement',
    description: 'Models agree on direction but differ on details',
    outcome: 'Surface differences, user decides',
    models: [
      { name: 'Claude', position: 'Quote $450, 5-day timeline' },
      { name: 'GPT-4', position: 'Quote $450, 7-day timeline' },
      { name: 'Gemini', position: 'Quote $475, 5-day timeline' },
    ],
    result: 'PARTIAL CONSENSUS → Present options to user',
    color: 'text-gate-consensus',
  },
  {
    title: 'Strong Disagreement',
    description: 'Models contradict on critical decision',
    outcome: 'Escalate immediately, do not proceed',
    models: [
      { name: 'Claude', position: 'Reject quote, specs unclear' },
      { name: 'GPT-4', position: 'Approve quote at $600' },
      { name: 'Gemini', position: 'Request more information first' },
    ],
    result: 'NO CONSENSUS → Confidence: 35% → Escalate',
    color: 'text-control-error',
  },
]

export default function ConsensusPage() {
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
            Multi-Model Consensus
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            Multiple AI models critique each other. When they disagree, PulZ surfaces
            the conflict, not hides it. You make the call.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <ConsensusVisualizer />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            The Consensus Engine
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: 'Generate', title: 'Primary model', desc: 'Claude proposes action' },
              { step: 'Critique', title: 'Secondary models', desc: 'GPT-4 / Gemini review' },
              { step: 'Compare', title: 'Agreement map', desc: 'Identify shared truth' },
              { step: 'Decide', title: 'Decision point', desc: 'Strong agreement or escalate' },
            ].map((item, idx) => (
              <div key={idx} className="glass-panel p-6 border-white/5 relative overflow-hidden">
                <div className="text-[40px] font-bold text-white/5 absolute -bottom-4 -right-2 select-none">
                  {idx + 1}
                </div>
                <div className="text-[10px] font-bold text-control-accent uppercase tracking-widest mb-2">
                  {item.step}
                </div>
                <div className="text-sm font-bold text-control-text-primary mb-1">
                  {item.title}
                </div>
                <div className="text-xs text-control-text-muted leading-relaxed">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Conflict Surface Examples
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6 flex flex-col"
              >
                <h3 className="text-lg font-bold mb-1 text-control-text-primary">
                  {scenario.title}
                </h3>
                <p className="text-xs text-control-text-secondary mb-4 leading-relaxed h-8">
                  {scenario.description}
                </p>
                
                <div className="space-y-2 mb-6 flex-grow">
                  {scenario.models.map((model, idx) => (
                    <div key={idx} className="glass-panel p-3 bg-black/20 border-white/5">
                      <div className="text-[9px] font-bold text-control-accent uppercase tracking-widest mb-1">
                        {model.name}
                      </div>
                      <div className="text-[10px] text-control-text-secondary font-mono leading-tight">
                        &quot;{model.position}&quot;
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="text-[10px] text-control-text-muted mb-2 font-medium">
                    OUTCOME: <span className="text-control-text-secondary">{scenario.outcome}</span>
                  </div>
                  <div className={`text-[10px] font-mono font-bold ${scenario.color} bg-black/30 p-2 rounded border border-white/5`}>
                    {scenario.result}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
