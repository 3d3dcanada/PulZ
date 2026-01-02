'use client'

import { motion } from 'framer-motion'
import GateValidator from '@/components/GateValidator'
import SystemMap from '@/components/SystemMap'

const gates = [
  {
    number: 1,
    name: 'Structural Gate',
    color: 'text-gate-structural',
    bg: 'bg-gate-structural/20',
    description: 'Schema Validation',
    purpose: 'Output must conform to predefined schema',
    process: [
      'Parse output against schema',
      'Check required fields',
      'Validate data types',
      'If fail: regenerate once',
      'If fail twice: stop and request correction',
    ],
    example: {
      input: '{ "quote_value": "500 dollars" }',
      issue: 'quote_value should be number, not string',
      outcome: 'REJECT → Regenerate with correct type',
    },
  },
  {
    number: 2,
    name: 'Evidence Gate',
    color: 'text-gate-evidence',
    bg: 'bg-gate-evidence/20',
    description: 'Citation & Proof Required',
    purpose: 'Claims affecting money, safety, compliance need evidence',
    process: [
      'Extract all factual claims',
      'Check for tool output evidence',
      'Check for external citation',
      'Check for USER_CONFIRMED marker',
      'Flag unverified claims',
    ],
    example: {
      input: 'Competitor pricing is $450 on average',
      issue: 'No citation or tool output provided',
      outcome: 'REJECT → Require source or mark as inference',
    },
  },
  {
    number: 3,
    name: 'Consistency Gate',
    color: 'text-gate-consistency',
    bg: 'bg-gate-consistency/20',
    description: 'No Contradictions',
    purpose: 'Check against context, memory, and business rules',
    process: [
      'Compare to task context',
      'Compare to stored memory',
      'Compare to business rules',
      'Surface conflicts as list',
      'Do not choose silently',
    ],
    example: {
      input: 'Use ABS for outdoor signage',
      issue: 'Memory shows: "PETG required for outdoor use"',
      outcome: 'CONFLICT → Surface to user for decision',
    },
  },
  {
    number: 4,
    name: 'Consensus Gate',
    color: 'text-gate-consensus',
    bg: 'bg-gate-consensus/20',
    description: 'Multi-Model Critique',
    purpose: 'Second model critiques primary output',
    process: [
      'Second model reviews output',
      'Check for missing assumptions',
      'Check for suspicious certainty',
      'Check for logic holes',
      'Check for security risks',
    ],
    example: {
      input: 'Quote approved, start production',
      issue: 'Critic notes: "Payment not confirmed"',
      outcome: 'HOLD → Require payment confirmation first',
    },
  },
]

export default function SafetyPage() {
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
            Four Validation Gates
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            Every output passes through four sequential gates. No exceptions.
            If any gate fails, the output is rejected, regenerated, or escalated.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <GateValidator />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Gate Details
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {gates.map((gate, index) => (
              <motion.div
                key={gate.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-8"
              >
                <div className="flex items-start mb-6">
                  <div
                    className={`w-16 h-16 rounded-xl ${gate.bg} flex items-center justify-center mr-6 flex-shrink-0 border border-white/5`}
                  >
                    <span className={`${gate.color} font-bold text-2xl`}>
                      {gate.number}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <h3 className={`text-2xl font-bold mb-2 ${gate.color}`}>
                      {gate.name}
                    </h3>
                    <p className="text-control-text-secondary">
                      {gate.description}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold tracking-widest text-control-accent mb-3 uppercase">
                    Purpose
                  </h4>
                  <p className="text-control-text-secondary text-sm leading-relaxed">
                    {gate.purpose}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold tracking-widest text-control-accent mb-3 uppercase">
                    Process
                  </h4>
                  <ul className="space-y-2">
                    {gate.process.map((step, idx) => (
                      <li key={idx} className="flex items-start text-xs">
                        <span className="text-control-accent mr-2">→</span>
                        <span className="text-control-text-muted">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel p-6 bg-black/20">
                  <h4 className="text-xs font-bold tracking-widest text-control-accent mb-3 uppercase">
                    Example Trace
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-control-text-muted">Input: </span>
                      <span className="text-control-text-secondary font-mono">
                        {gate.example.input}
                      </span>
                    </div>
                    <div>
                      <span className="text-control-warning">Issue: </span>
                      <span className="text-control-text-secondary">
                        {gate.example.issue}
                      </span>
                    </div>
                    <div>
                      <span className="text-control-success font-semibold">Outcome: </span>
                      <span className="text-control-text-secondary font-semibold">
                        {gate.example.outcome}
                      </span>
                    </div>
                  </div>
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
          className="glass-panel-bright p-8 border-l-4 border-control-accent"
        >
          <h2 className="text-2xl font-bold mb-6 text-control-accent">
            Governance Hardening
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-bold mb-4">Evidence Grounding</h3>
              <p className="text-control-text-secondary text-sm leading-relaxed mb-4">
                No claim leaves the system without explicit grounding. Every assertion is tagged:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-control-success" />
                  <span className="text-control-text-primary font-medium">Evidence-backed</span>
                  <span className="text-control-text-muted">(Citations provided)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-control-warning" />
                  <span className="text-control-text-primary font-medium">Configurable Assumption</span>
                  <span className="text-control-text-muted">(Based on your rules)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Human-in-the-Loop</h3>
              <p className="text-control-text-secondary text-sm leading-relaxed">
                The gates are automated, but the authority is human. If a gate cannot resolve 
                a conflict with 100% certainty, it escalates. The system is designed to stop, 
                not to guess.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
