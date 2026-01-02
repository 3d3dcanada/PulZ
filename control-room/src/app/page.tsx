'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const features = [
  {
    title: 'Four Validation Gates',
    description: 'Every output passes through structural, evidence, consistency, and consensus gates.',
    href: '/safety',
    icon: '🛡️',
    color: 'gate-structural',
  },
  {
    title: 'Confidence Scoring',
    description: 'Transparent confidence levels determine what requires approval and what can proceed.',
    href: '/confidence',
    icon: '📊',
    color: 'gate-evidence',
  },
  {
    title: 'Multi-Model Consensus',
    description: 'Multiple AI models critique each other. Disagreements surface, not hide.',
    href: '/consensus',
    icon: '🤝',
    color: 'gate-consensus',
  },
  {
    title: 'Business Lanes',
    description: 'Quote intake, tender screening, email parsing—structured for real operations.',
    href: '/lanes',
    icon: '⚙️',
    color: 'gate-consistency',
  },
]

const principles = [
  { label: 'One daily conversation', value: 'Not spam' },
  { label: 'No hallucinations', value: 'Validated only' },
  { label: 'No stupid questions', value: 'Context aware' },
  { label: 'Maximum time back', value: 'Decision ready' },
]

export default function Home() {
  return (
    <div className="pt-16">
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-control-accent/5 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">PulZ</span>
              <br />
              <span className="text-3xl md:text-4xl text-control-text-secondary font-normal">
                AI Orchestration Control Room
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-control-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
              Governance-first orchestration system.
              <br />
              No hallucinations. No surprises. No loss of control.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/philosophy" className="control-button">
                See the Philosophy
              </Link>
              <Link href="/safety" className="control-button border-control-accent/50">
                Explore Safety Gates
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            {principles.map((principle, index) => (
              <motion.div
                key={principle.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="glass-panel p-4"
              >
                <div className="text-control-accent text-sm font-semibold mb-1">
                  {principle.label}
                </div>
                <div className="text-control-text-muted text-xs">
                  {principle.value}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
              Built for Trust
            </h2>
            <p className="text-control-text-secondary max-w-2xl mx-auto">
              Every component is designed to reinforce trust through transparency,
              validation, and human-centered control.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Link href={feature.href} className="block group">
                  <div className="glass-panel-bright p-8 h-full hover:border-control-accent/50 transition-all duration-300">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-control-accent transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-control-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-control-surface/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6">
              This system respects you
            </h2>
            <p className="text-xl text-control-text-secondary mb-8 leading-relaxed">
              It won&apos;t act behind your back. It won&apos;t waste your time with stupid questions.
              It was built by adults, for adults who run real businesses.
            </p>
            <Link href="/architecture" className="control-button inline-block">
              Understand the Architecture
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
