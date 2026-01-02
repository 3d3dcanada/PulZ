'use client'

import { motion } from 'framer-motion'
import ConfidenceSlider from '@/components/ConfidenceSlider'

const thresholds = [
  {
    range: '90–100',
    level: 'Auto-Safe',
    color: 'control-success',
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
    color: 'gate-consensus',
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
    color: 'control-warning',
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
    color: 'control-error',
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
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Confidence Thresholds
          </h2>
          <div className="space-y-6">
            {thresholds.map((threshold, index) => (
              <motion.div
                key={threshold.range}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <div className="flex items-start mb-4">
                  <div
                    className={`px-4 py-2 rounded-lg bg-${threshold.color}/20 mr-6`}
                  >
                    <span className={`text-${threshold.color} font-bold text-lg`}>
                      {threshold.range}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <h3 className={`text-xl font-bold mb-2 text-${threshold.color}`}>
                      {threshold.level}
                    </h3>
                    <p className="text-control-text-secondary">
                      <span className="font-semibold">Action: </span>
                      {threshold.action}
                    </p>
                  </div>
                </div>
                <div className="glass-panel p-4 bg-control-bg/40">
                  <div className="text-sm font-semibold text-control-accent mb-2">
                    EXAMPLES
                  </div>
                  <ul className="space-y-2">
                    {threshold.examples.map((example, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="text-control-accent mr-2">→</span>
                        <span className="text-control-text-muted">{example}</span>
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
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Scoring Factors
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {factors.map((item, index) => (
              <motion.div
                key={item.factor}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <h3 className="text-lg font-bold mb-4 text-control-text-primary">
                  {item.factor}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-control-success mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-control-success mb-1">
                        High Confidence
                      </div>
                      <div className="text-sm text-control-text-muted">
                        {item.high}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-control-error mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-control-error mb-1">
                        Low Confidence
                      </div>
                      <div className="text-sm text-control-text-muted">
                        {item.low}
                      </div>
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
