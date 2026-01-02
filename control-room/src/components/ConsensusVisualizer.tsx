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
          Consensus Visualizer
        </h3>
        <p className="text-control-text-secondary mb-6 text-sm">
          Multi-model cross-critique and agreement mapping.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {scenarios.map((s, index) => (
          <button
            key={s.name}
            onClick={() => setSelectedScenario(index)}
            className={`control-button text-[10px] uppercase tracking-widest ${
              selectedScenario === index ? 'border-control-accent bg-white/10' : 'opacity-60'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedScenario}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {scenario.models.map((model, index) => (
              <motion.div
                key={model.model}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-panel p-6 flex flex-col border-white/5"
              >
                <h4
                  className="text-sm font-bold text-center mb-4 tracking-tight"
                  style={{ color: model.color }}
                >
                  {model.model}
                </h4>
                <div className="glass-panel p-4 bg-black/20 mb-4 flex-grow border-white/5">
                  <p className="text-[11px] text-control-text-secondary text-center leading-relaxed">
                    &quot;{model.position}&quot;
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-control-text-muted uppercase tracking-widest">Score: </span>
                  <span className="text-xs font-mono font-bold" style={{ color: model.color }}>
                    {model.confidence}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glass-panel p-8 bg-black/30 border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-bold text-control-accent uppercase tracking-[0.2em]">
                Agreement Score
              </h4>
              <motion.span
                key={scenario.agreement}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold tracking-tighter"
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

            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mb-8 shadow-inner">
              <motion.div
                className="absolute left-0 top-0 bottom-0"
                initial={{ width: 0 }}
                animate={{ width: `${scenario.agreement}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                style={{
                  backgroundColor:
                    scenario.agreement >= 80
                      ? '#10b981'
                      : scenario.agreement >= 60
                      ? '#f59e0b'
                      : '#ef4444',
                  boxShadow: `0 0 20px ${scenario.agreement >= 80 ? '#10b981' : scenario.agreement >= 60 ? '#f59e0b' : '#ef4444'}30`,
                }}
              />
            </div>

            <div className="text-center">
              <motion.div
                key={scenario.outcome}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-block px-8 py-2 rounded-full font-bold text-xs uppercase tracking-[0.15em] border ${
                  scenario.outcome === 'CONSENSUS'
                    ? 'bg-control-success/10 text-control-success border-control-success/30'
                    : scenario.outcome === 'PARTIAL'
                    ? 'bg-control-warning/10 text-control-warning border-control-warning/30'
                    : 'bg-control-error/10 text-control-error border-control-error/30'
                }`}
              >
                {scenario.outcome === 'CONSENSUS' && 'Consensus Reached'}
                {scenario.outcome === 'PARTIAL' && 'Partial Agreement'}
                {scenario.outcome === 'CONFLICT' && 'System Conflict'}
              </motion.div>
            </div>
          </div>

          <div className="mt-6 glass-panel p-6 bg-black/40 border-white/5 border-l-2" style={{ borderLeftColor: scenario.agreement >= 80 ? '#10b981' : scenario.agreement >= 60 ? '#f59e0b' : '#ef4444' }}>
            <h5 className="text-[10px] font-bold text-control-accent mb-2 uppercase tracking-widest">
              Execution Logic
            </h5>
            <p className="text-xs text-control-text-muted leading-relaxed">
              {scenario.outcome === 'CONSENSUS' &&
                'High-confidence agreement detected across all critiques. The proposed action is cleared for automated processing or standard brief inclusion.'}
              {scenario.outcome === 'PARTIAL' &&
                'Primary direction agreed but specific parameters diverge. System will present all variations to the human authority for final selection.'}
              {scenario.outcome === 'CONFLICT' &&
                'Fundamental disagreement detected. Circuit breaker active. All automated processing halted. Requires immediate human investigation.'}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
