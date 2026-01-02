'use client'

import { motion } from 'framer-motion'
import ConfidenceSlider from '@/components/ConfidenceSlider'
import SystemMap from '@/components/SystemMap'

const thresholds = [
  {
    range: '90–100',
    level: 'Auto-Safe',
    colorClass: 'text-control-success',
    bgClass: 'bg-control-success/20',
    action: 'Proceed automatically',
    examples: [
      'Database query returned verified data',
      'Schema validation passed with all required fields',
      'Multiple models agree, backed by citations',
    ],
  },
  {
    range: '70–89',
    level: 'Reversible Only',
    colorClass: 'text-gate-consensus',
    bgClass: 'bg-gate-consensus/20',
    action: 'Drafts, proposals, staging changes only',
    examples: [
      'Generate draft email (not sent)',
      'Create proposal document (not submitted)',
      'Update staging environment (not production)',
    ],
  },
  {
    range: '50–69',
    level: 'Approval Required',
    colorClass: 'text-control-warning',
    bgClass: 'bg-control-warning/20',
    action: 'User must explicitly approve',
    examples: [
      'Quote pricing based on incomplete specs',
      'Routing decision with missing maker data',
      'Cost estimate with uncertain variables',
    ],
  },
  {
    range: '<50',
    level: 'Refuse / Escalate',
    colorClass: 'text-control-error',
    bgClass: 'bg-control-error/20',
    action: 'Do not proceed, request clarification',
    examples: [
      'Conflicting information from sources',
      'No evidence for critical claim',
      'Models strongly disagree',
    ],
  },
]

const factors = [
  {
    factor: 'Evidence Quality',
    high: 'Direct tool output or cited source',
    low: 'Inference or assumption',
  },
  {
    factor: 'Model Agreement',
    high: 'All models agree on key points',
    low: 'Models contradict each other',
  },
  {
    factor: 'Context Completeness',
    high: 'All required information available',
    low: 'Missing critical details',
  },
  {
    factor: 'Historical Pattern',
    high: 'Strong match to known patterns',
    low: 'Novel situation, no precedent',
  },
]

export default function ConfidencePage() {
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
            Confidence Scoring
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            Every output receives a 0–100 confidence score based on evidence quality,
            model agreement, and context completeness. The score determines what can
            proceed automatically and what requires approval.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <ConfidenceSlider />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent text-center">
            Confidence Thresholds
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {thresholds.map((threshold, index) => (
              <motion.div
                key={threshold.range}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6 flex flex-col"
              >
                <div className="flex items-start mb-4">
                  <div
                    className={`px-4 py-1.5 rounded-full ${threshold.bgClass} mr-4 border border-white/5 flex-shrink-0`}
                  >
                    <span className={`${threshold.colorClass} font-mono font-bold text-sm tracking-tighter`}>
                      {threshold.range}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold mb-1 ${threshold.colorClass}`}>
                      {threshold.level}
                    </h3>
                    <p className="text-control-text-secondary text-xs font-medium">
                       {threshold.action}
                    </p>
                  </div>
                </div>
                <div className="glass-panel p-4 bg-black/20 mt-auto">
                  <h4 className="text-[10px] font-bold text-control-accent mb-3 uppercase tracking-widest opacity-70">
                    Example Scenarios
                  </h4>
                  <ul className="space-y-2">
                    {threshold.examples.map((example, idx) => (
                      <li key={idx} className="flex items-start text-[11px]">
                        <span className="text-control-accent mr-2 opacity-50">→</span>
                        <span className="text-control-text-muted leading-tight">{example}</span>
                      </li>
                    ))}
                  </ul>
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
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Scoring Factors
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {factors.map((item, index) => (
              <motion.div
                key={item.factor}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel p-6 flex flex-col"
              >
                <h3 className="text-base font-bold mb-4 text-control-text-primary h-12 flex items-center">
                  {item.factor}
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-control-success mb-1 uppercase tracking-widest opacity-80">
                      High Confidence
                    </div>
                    <div className="text-[11px] text-control-text-secondary leading-snug">
                      {item.high}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-control-error mb-1 uppercase tracking-widest opacity-80">
                      Low Confidence
                    </div>
                    <div className="text-[11px] text-control-text-secondary leading-snug">
                      {item.low}
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
