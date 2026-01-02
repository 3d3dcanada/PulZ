'use client'

import { motion } from 'framer-motion'

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

          <div className="space-y-6">
            {truthModel.map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <h3 className="text-lg font-bold mb-2 text-control-text-primary">
                  {index + 1}. {item.type}
                </h3>
                <p className="text-control-text-secondary mb-3">
                  {item.description}
                </p>
                <div className="glass-panel p-3 bg-control-bg/40">
                  <span className="text-sm text-control-text-muted font-mono">
                    Example: {item.example}
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
          <h2 className="text-2xl font-bold mb-6 text-control-accent">
            The No Hallucination Contract
          </h2>
          <div className="glass-panel-bright p-8">
            <p className="text-control-text-secondary mb-6 leading-relaxed">
              PulZ enforces a strict protocol for every output:
            </p>
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  1
                </span>
                <div>
                  <span className="font-semibold text-control-text-primary">Extract claims</span>
                  <p className="text-control-text-muted text-sm mt-1">
                    Identify every factual assertion
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  2
                </span>
                <div>
                  <span className="font-semibold text-control-text-primary">Validate claims</span>
                  <p className="text-control-text-muted text-sm mt-1">
                    Check against truth model criteria
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  3
                </span>
                <div>
                  <span className="font-semibold text-control-text-primary">Assign confidence</span>
                  <p className="text-control-text-muted text-sm mt-1">
                    0-100 score based on evidence quality
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  4
                </span>
                <div>
                  <span className="font-semibold text-control-text-primary">Refuse or escalate</span>
                  <p className="text-control-text-muted text-sm mt-1">
                    If confidence is below threshold, don&apos;t proceed
                  </p>
                </div>
              </li>
            </ol>
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
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <h3 className="text-lg font-bold mb-2 text-control-text-primary">
                  {item.rule}
                </h3>
                <p className="text-control-text-secondary text-sm mb-3">
                  <span className="text-control-accent font-semibold">Why: </span>
                  {item.why}
                </p>
                <p className="text-control-text-muted text-sm">
                  <span className="text-gate-consistency font-semibold">How: </span>
                  {item.how}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
