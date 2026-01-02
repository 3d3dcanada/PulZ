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
          Confidence Calculator
        </h3>
        <p className="text-control-text-secondary mb-6 text-sm">
          Dynamic scoring based on evidence quality, model agreement, and context completeness.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-16">
        <motion.div
          className="relative h-24 rounded-2xl overflow-hidden mb-6 bg-black/40 border border-white/5 shadow-inner"
        >
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 90%, #10b981 100%)',
            }}
          />
          <motion.div
            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10"
            animate={{ left: `${confidence}%` }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                key={confidence}
                className="text-3xl font-bold text-white mb-0"
              >
                {confidence}%
              </motion.div>
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <div
                className="text-xs font-bold mb-0.5 uppercase tracking-wider"
                style={{ color: level.color }}
              >
                {level.level}
              </div>
              <div className="text-[10px] text-control-text-muted">
                {level.action}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="space-y-8 mt-24">
          {[
            { label: 'Evidence Quality', state: evidence, setter: setEvidence, color: '#3b82f6', low: 'Inference', high: 'Cited Proof' },
            { label: 'Model Agreement', state: modelAgreement, setter: setModelAgreement, color: '#8b5cf6', low: 'Conflict', high: 'Consensus' },
            { label: 'Context Completeness', state: context, setter: setContext, color: '#06b6d4', low: 'Missing', high: 'Complete' },
          ].map((slider) => (
            <div key={slider.label}>
              <div className="flex justify-between mb-3">
                <label className="text-xs font-bold text-control-text-primary uppercase tracking-widest">
                  {slider.label}
                </label>
                <span className="text-xs text-control-accent font-mono">
                  {slider.state}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={slider.state}
                onChange={(e) => slider.setter(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/5 accent-control-accent"
              />
              <div className="flex justify-between mt-2 text-[10px] text-control-text-muted uppercase tracking-tighter">
                <span>{slider.low}</span>
                <span>{slider.high}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 bg-black/20 max-w-2xl mx-auto border-white/5">
        <h4 className="text-[10px] font-bold text-control-accent mb-3 uppercase tracking-[0.2em]">
          Scoring Formula
        </h4>
        <div className="font-mono text-xs text-control-text-secondary leading-relaxed">
          Confidence = (Evidence × 0.40) + (Agreement × 0.35) + (Context × 0.25)
        </div>
        <div className="mt-4 text-[10px] text-control-text-muted leading-relaxed italic">
          Evidence quality is weighted highest (40%), followed by cross-model consensus (35%) 
          and context completeness (25%). 
        </div>
      </div>
    </div>
  )
}
