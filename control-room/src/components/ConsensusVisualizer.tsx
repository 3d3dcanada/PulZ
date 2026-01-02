'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ModelResponse {
  model: string
  position: string
  confidence: number
  color: string
}

const scenarios = [
  {
    name: 'Strong Agreement',
    models: [
      { model: 'Claude', position: 'Approve at $450', confidence: 92, color: '#3b82f6' },
      { model: 'GPT-4', position: 'Approve at $450', confidence: 90, color: '#8b5cf6' },
      { model: 'Gemini', position: 'Approve at $450', confidence: 88, color: '#06b6d4' },
    ],
    agreement: 95,
    outcome: 'CONSENSUS',
  },
  {
    name: 'Partial Agreement',
    models: [
      { model: 'Claude', position: 'Approve at $450', confidence: 78, color: '#3b82f6' },
      { model: 'GPT-4', position: 'Approve at $475', confidence: 75, color: '#8b5cf6' },
      { model: 'Gemini', position: 'Approve at $450', confidence: 72, color: '#06b6d4' },
    ],
    agreement: 70,
    outcome: 'PARTIAL',
  },
  {
    name: 'Strong Disagreement',
    models: [
      { model: 'Claude', position: 'Reject - unclear specs', confidence: 65, color: '#3b82f6' },
      { model: 'GPT-4', position: 'Approve at $600', confidence: 70, color: '#8b5cf6' },
      { model: 'Gemini', position: 'Request more info', confidence: 55, color: '#06b6d4' },
    ],
    agreement: 35,
    outcome: 'CONFLICT',
  },
]

export default function ConsensusVisualizer() {
  const [selectedScenario, setSelectedScenario] = useState(0)
  const scenario = scenarios[selectedScenario]

  return (
    <div className="glass-panel-bright p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-4 text-control-accent">
          Interactive Consensus Visualizer
        </h3>
        <p className="text-control-text-secondary mb-6">
          See how different models respond to the same decision and how consensus is measured.
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {scenarios.map((s, index) => (
          <button
            key={s.name}
            onClick={() => setSelectedScenario(index)}
            className={`control-button ${
              selectedScenario === index ? 'border-control-accent' : ''
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedScenario}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {scenario.models.map((model, index) => (
              <motion.div
                key={model.model}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="glass-panel p-6"
                style={{ borderColor: `${model.color}40` }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                  style={{ backgroundColor: `${model.color}20` }}
                >
                  <span className="text-2xl">🤖</span>
                </div>
                <h4
                  className="text-lg font-bold text-center mb-3"
                  style={{ color: model.color }}
                >
                  {model.model}
                </h4>
                <div className="glass-panel p-3 bg-control-bg/60 mb-3">
                  <p className="text-sm text-control-text-secondary text-center">
                    {model.position}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-control-text-muted">Confidence: </span>
                  <span className="text-sm font-mono text-control-accent">
                    {model.confidence}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glass-panel p-6 bg-control-bg/60">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-control-accent">
                Agreement Score
              </h4>
              <motion.span
                key={scenario.agreement}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold"
                style={{
                  color:
                    scenario.agreement >= 80
                      ? '#10b981'
                      : scenario.agreement >= 60
                      ? '#f59e0b'
                      : '#ef4444',
                }}
              >
                {scenario.agreement}%
              </motion.span>
            </div>

            <div className="relative h-4 bg-control-surface rounded-full overflow-hidden mb-4">
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${scenario.agreement}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  backgroundColor:
                    scenario.agreement >= 80
                      ? '#10b981'
                      : scenario.agreement >= 60
                      ? '#f59e0b'
                      : '#ef4444',
                }}
              />
            </div>

            <div className="text-center">
              <motion.div
                key={scenario.outcome}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-block px-6 py-2 rounded-lg font-bold ${
                  scenario.outcome === 'CONSENSUS'
                    ? 'bg-control-success/20 text-control-success'
                    : scenario.outcome === 'PARTIAL'
                    ? 'bg-control-warning/20 text-control-warning'
                    : 'bg-control-error/20 text-control-error'
                }`}
              >
                {scenario.outcome === 'CONSENSUS' && '✓ CONSENSUS REACHED'}
                {scenario.outcome === 'PARTIAL' && '⚠ PARTIAL CONSENSUS - USER DECIDES'}
                {scenario.outcome === 'CONFLICT' && '✕ CONFLICT - ESCALATE TO HUMAN'}
              </motion.div>
            </div>
          </div>

          <div className="mt-6 glass-panel p-4 bg-control-bg/40">
            <h5 className="text-sm font-semibold text-control-accent mb-2">
              WHAT HAPPENS NEXT
            </h5>
            <p className="text-sm text-control-text-muted">
              {scenario.outcome === 'CONSENSUS' &&
                'All models agree within acceptable variance. The action can proceed with high confidence.'}
              {scenario.outcome === 'PARTIAL' &&
                'Models mostly agree but differ on details. Present all options to user for final decision.'}
              {scenario.outcome === 'CONFLICT' &&
                'Models fundamentally disagree. Do not proceed. Surface all positions and request explicit guidance.'}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
