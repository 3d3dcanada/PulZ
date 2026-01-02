'use client'

import { motion } from 'framer-motion'
import SystemMap from '@/components/SystemMap'

const truthModel = [
  {
    type: 'Direct Observation',
    description: 'Tool outputs, logs, database values, API responses',
    example: 'Database shows 47 pending quotes',
  },
  {
    type: 'User-Confirmed Fact',
    description: 'Explicitly confirmed by you',
    example: 'You stated: &ldquo;We use PETG for outdoor parts&rdquo;',
  },
  {
    type: 'Cited External Source',
    description: 'Referenced and stored citation',
    example: 'Material spec from manufacturer datasheet [PDF]',
  },
  {
    type: 'Consensus Inference',
    description: 'Clearly labeled as inference, backed by multiple models',
    example: 'Likely outcome based on historical pattern (Claude + GPT agree, 87% confidence)',
  },
]

const operationalRules = [
  {
    rule: 'One Daily Session',
    why: 'Respect your time and attention',
    how: 'Morning brief + decisions + queued actions',
  },
  {
    rule: 'No Interruptions',
    why: 'Unless true emergency (fraud, major cost spike)',
    how: 'Pattern detection + threshold triggers only',
  },
  {
    rule: 'No Stupid Questions',
    why: 'Context and memory already have the answer',
    how: 'Check docs → memory → context before asking',
  },
  {
    rule: 'Propose, Don&apos;t Ask',
    why: 'Save time on decisions that don&apos;t matter',
    how: 'Default to safe choice unless material impact',
  },
]

export default function PhilosophyPage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <SystemMap />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Philosophy
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            PulZ is built on a simple premise: one daily conversation, no hallucinations,
            no stupid questions, maximum time back.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 text-control-accent">
            The Truth Model
          </h2>
          <p className="text-control-text-secondary mb-8 leading-relaxed">
            PulZ only treats something as &ldquo;true&rdquo; if it meets one of these criteria.
            Everything else is labeled as UNVERIFIED.
          </p>

          <div className="space-y-4">
            {truthModel.map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <div className="flex items-center mb-2">
                   <span className="text-xs font-mono text-control-accent mr-3">0{index + 1}</span>
                   <h3 className="text-lg font-bold text-control-text-primary">
                    {item.type}
                  </h3>
                </div>
                <p className="text-control-text-secondary mb-4 text-sm">
                  {item.description}
                </p>
                <div className="glass-panel p-3 bg-black/20">
                  <span className="text-xs text-control-text-muted font-mono">
                    PROVENANCE: {item.example}
                  </span>
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
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 text-control-accent text-center">
            The No Hallucination Contract
          </h2>
          <div className="glass-panel-bright p-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: 'Extract', desc: 'Identify every factual assertion' },
                { step: 'Validate', desc: 'Check against truth model' },
                { step: 'Score', desc: '0-100 confidence based on proof' },
                { step: 'Halt', desc: 'If unverified, do not proceed' },
              ].map((item, idx) => (
                <div key={idx} className="text-center p-4 glass-panel bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-control-accent/20 flex items-center justify-center mx-auto mb-3 text-control-accent font-bold">
                    {idx + 1}
                  </div>
                  <div className="font-bold text-sm mb-1">{item.step}</div>
                  <div className="text-[10px] text-control-text-muted uppercase tracking-tighter">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-control-accent">
            Operational Cadence
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {operationalRules.map((item, index) => (
              <motion.div
                key={item.rule}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <h3 className="text-lg font-bold mb-2 text-control-text-primary">
                  {item.rule}
                </h3>
                <div className="space-y-2">
                  <p className="text-control-text-secondary text-xs">
                    <span className="text-control-accent font-bold uppercase tracking-widest text-[10px] mr-2">Why</span>
                    {item.why}
                  </p>
                  <p className="text-control-text-secondary text-xs">
                    <span className="text-gate-consistency font-bold uppercase tracking-widest text-[10px] mr-2">How</span>
                    {item.how}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
