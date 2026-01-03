'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const ENTRY_FEATURES = [
  {
    id: 'control-room',
    title: 'Control Room',
    description: 'Full governance interface with real-time confidence scoring, consensus validation, and audit trails.',
    href: '/control-room',
    icon: '⚡',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    isPrimary: true,
  },
  {
    id: 'walkthrough',
    title: 'Investor Walkthrough',
    description: 'Complete guided tour of PulZ architecture, design philosophy, and business value proposition.',
    href: '/philosophy',
    icon: '👁️',
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'guarantees',
    title: 'Governance Guarantees',
    description: 'Explore the anti-hallucination contract, evidence gating, and human authority invariants.',
    href: '/safety',
    icon: '🛡️',
    color: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
  },
]

const GOVERNANCE_PRINCIPLES = [
  {
    label: 'Human Authority Required',
    description: 'No silent autonomy. Irreversible actions always need explicit approval.',
    icon: '👤',
  },
  {
    label: 'Evidence-Gated',
    description: 'Every recommendation must reference a Truth Model criterion before execution.',
    icon: '📋',
  },
  {
    label: 'Append-Only Audit',
    description: 'All decisions are logged with cryptographic hashes. History cannot be rewritten.',
    icon: '🔐',
  },
  {
    label: 'Multi-Model Consensus',
    description: 'Primary outputs are critiqued by secondary models. Disagreements surface, not hide.',
    icon: '🤝',
  },
]

export default function EntryPage() {
  return (
    <div className="min-h-screen bg-control-bg">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-control-accent/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gate-consensus/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-block px-4 py-1.5 mb-8 glass-panel border-white/10">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-control-accent">
                Authorized Access
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter">
              <span className="text-gradient">Welcome</span>
            </h1>

            <p className="text-xl md:text-2xl text-control-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              You have entered the PulZ Control Room. Choose your path below.
            </p>
          </motion.div>

          {/* Entry Paths */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
            {ENTRY_FEATURES.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.15, duration: 0.8 }}
              >
                <Link
                  href={feature.href}
                  className={`block h-full p-8 rounded-xl border transition-all duration-500 hover:scale-105 ${
                    feature.isPrimary
                      ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50'
                      : `bg-gradient-to-br ${feature.color} ${feature.borderColor} hover:border-opacity-50`
                  }`}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-control-text-primary">{feature.title}</h3>
                  <p className="text-sm text-control-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                  {feature.isPrimary && (
                    <div className="mt-4 text-xs font-bold uppercase tracking-wider text-control-accent">
                      Primary Access
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance Principles */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              Governance by Design
            </h2>
            <p className="text-control-text-secondary max-w-2xl mx-auto text-lg font-light leading-relaxed">
              These are not slogans. They are structural invariants enforced at the code level.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GOVERNANCE_PRINCIPLES.map((principle, index) => (
              <motion.div
                key={principle.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="glass-panel p-6 hover:bg-white/[0.04] transition-colors"
              >
                <div className="text-3xl mb-4">{principle.icon}</div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-control-text-primary">
                  {principle.label}
                </h3>
                <p className="text-xs text-control-text-secondary leading-relaxed">
                  {principle.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-8 tracking-tight">
              Quick Navigation
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: '/architecture', label: 'System Architecture' },
                { href: '/confidence', label: 'Confidence Scoring' },
                { href: '/consensus', label: 'Multi-Model Consensus' },
                { href: '/lanes', label: 'Business Lanes' },
                { href: '/deploy', label: 'Deployment Guide' },
                { href: '/learning', label: 'Learning Library' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="control-button block text-center"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm text-control-text-secondary mb-4">
              PulZ AI Orchestration OS
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <div className="h-[1px] w-12 bg-control-accent/50 self-center" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-control-text-muted">
                3D3D.ca
              </span>
              <div className="h-[1px] w-12 bg-control-accent/50 self-center" />
            </div>
            <p className="text-[10px] text-control-text-muted uppercase tracking-wider">
              Governance-First &bull; Audit-Ready &bull; Human-Centered
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
