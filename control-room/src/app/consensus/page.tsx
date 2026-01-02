'use client'

import { motion } from 'framer-motion'
import ConsensusVisualizer from '@/components/ConsensusVisualizer'

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
  },
]

export default function ConsensusPage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
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
            How Consensus Works
          </h2>
          <div className="glass-panel-bright p-8">
            <ol className="space-y-6">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-control-text-primary mb-2">
                    Primary Model Generates Output
                  </h3>
                  <p className="text-control-text-muted text-sm">
                    The primary model (e.g., Claude) generates a proposed action, decision, or response.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="font-semibold text-control-text-primary mb-2">
                    Critique Models Review
                  </h3>
                  <p className="text-control-text-muted text-sm">
                    Secondary models (e.g., GPT-4, Gemini) independently critique the output, checking for
                    missing assumptions, logic holes, and risks.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="font-semibold text-control-text-primary mb-2">
                    Agreement Map Generated
                  </h3>
                  <p className="text-control-text-muted text-sm">
                    PulZ compares all model outputs and creates a map: what everyone agrees on,
                    where they differ, and what&apos;s contested.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-control-accent/20 text-control-accent font-bold mr-4 flex-shrink-0">
                  4
                </span>
                <div>
                  <h3 className="font-semibold text-control-text-primary mb-2">
                    Decision Point
                  </h3>
                  <p className="text-control-text-muted text-sm">
                    If consensus is strong, proceed with confidence boost. If disagreement is significant,
                    escalate to human for tiebreak. Never choose silently.
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
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Consensus Scenarios
          </h2>
          <div className="space-y-6">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <h3 className="text-xl font-bold mb-2 text-control-text-primary">
                  {scenario.title}
                </h3>
                <p className="text-control-text-secondary mb-4">
                  {scenario.description}
                </p>
                
                <div className="space-y-3 mb-4">
                  {scenario.models.map((model, idx) => (
                    <div key={idx} className="glass-panel p-3 bg-control-bg/40">
                      <span className="text-control-accent font-semibold text-sm mr-2">
                        {model.name}:
                      </span>
                      <span className="text-control-text-muted text-sm">
                        {model.position}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="text-sm text-control-text-muted mb-2">
                      <span className="font-semibold text-control-accent">Outcome: </span>
                      {scenario.outcome}
                    </div>
                    <div className="text-sm font-mono text-control-success">
                      {scenario.result}
                    </div>
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
