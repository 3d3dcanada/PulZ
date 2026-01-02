'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ConfidenceSlider() {
  const [evidence, setEvidence] = useState(70)
  const [modelAgreement, setModelAgreement] = useState(80)
  const [context, setContext] = useState(60)

  const confidence = Math.round((evidence * 0.4 + modelAgreement * 0.35 + context * 0.25))

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { level: 'Auto-Safe', color: '#10b981', action: 'Proceed automatically' }
    if (score >= 70) return { level: 'Reversible Only', color: '#10b981', action: 'Drafts & staging only' }
    if (score >= 50) return { level: 'Approval Required', color: '#f59e0b', action: 'User must approve' }
    return { level: 'Refuse / Escalate', color: '#ef4444', action: 'Do not proceed' }
  }

  const level = getConfidenceLevel(confidence)

  return (
    <div className="glass-panel-bright p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-4 text-control-accent">
          Interactive Confidence Calculator
        </h3>
        <p className="text-control-text-secondary mb-6">
          Adjust the sliders to see how different factors affect confidence scoring.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <motion.div
          className="relative h-32 rounded-lg overflow-hidden mb-6"
          style={{
            background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 90%, #10b981 100%)',
          }}
        >
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            animate={{ left: `${confidence}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                key={confidence}
                className="text-4xl font-bold text-white mb-1"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              >
                {confidence}
              </motion.div>
              <div className="text-xs text-white/80">CONFIDENCE</div>
            </div>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <div
                className="text-sm font-bold mb-1"
                style={{ color: level.color }}
              >
                {level.level}
              </div>
              <div className="text-xs text-control-text-muted">
                {level.action}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="space-y-6 mt-20">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-control-text-primary">
                Evidence Quality
              </label>
              <span className="text-sm text-control-accent font-mono">
                {evidence}% (40% weight)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={evidence}
              onChange={(e) => setEvidence(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${evidence}%, #1e293b ${evidence}%, #1e293b 100%)`,
              }}
            />
            <div className="flex justify-between mt-1 text-xs text-control-text-muted">
              <span>Inference</span>
              <span>Cited Source</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-control-text-primary">
                Model Agreement
              </label>
              <span className="text-sm text-control-accent font-mono">
                {modelAgreement}% (35% weight)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={modelAgreement}
              onChange={(e) => setModelAgreement(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${modelAgreement}%, #1e293b ${modelAgreement}%, #1e293b 100%)`,
              }}
            />
            <div className="flex justify-between mt-1 text-xs text-control-text-muted">
              <span>Disagree</span>
              <span>Full Consensus</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-control-text-primary">
                Context Completeness
              </label>
              <span className="text-sm text-control-accent font-mono">
                {context}% (25% weight)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={context}
              onChange={(e) => setContext(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${context}%, #1e293b ${context}%, #1e293b 100%)`,
              }}
            />
            <div className="flex justify-between mt-1 text-xs text-control-text-muted">
              <span>Missing Info</span>
              <span>Complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 bg-control-bg/60 max-w-2xl mx-auto">
        <h4 className="text-sm font-semibold text-control-accent mb-3">
          SCORING FORMULA
        </h4>
        <div className="font-mono text-sm text-control-text-muted">
          Confidence = (Evidence × 0.40) + (Agreement × 0.35) + (Context × 0.25)
        </div>
        <div className="mt-4 text-xs text-control-text-muted">
          The weights reflect that direct evidence is the strongest signal,
          followed by model consensus, then context completeness.
        </div>
      </div>
    </div>
  )
}
