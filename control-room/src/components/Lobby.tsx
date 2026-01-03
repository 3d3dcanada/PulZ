'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { grantAccess } from '@/config/keyring'

export default function Lobby({ onEnter }: { onEnter: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault()

    if (!acknowledged) return

    grantAccess(rememberMe)
    onEnter()
  }

  return (
    <div className="min-h-screen bg-control-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-control-accent/5 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gate-consensus/5 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="glass-panel-bright p-8 md:p-12"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tighter">
              <span className="text-gradient">PulZ</span>
            </h1>
            <p className="text-control-text-secondary text-base font-light">Operator Boundary</p>
          </motion.div>

          {/* What is this gate */}
          <div className="mb-8 p-6 bg-control-accent/5 border border-control-accent/20 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🚪</div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-control-accent mb-2">
                  What is this gate?
                </h3>
                <p className="text-sm text-control-text-secondary leading-relaxed">
                  This is an operator acknowledgment boundary for a demo environment. It is not authentication and it does not
                  protect sensitive data. It exists to block casual indexing, stop accidental entry, and ensure a human
                  understands what they are about to view. Real access control will be added via Supabase in the next phase.
                </p>
              </div>
            </div>
          </div>

          {/* What is PulZ */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('what-is-pulz')}
              className="w-full flex items-center justify-between p-4 bg-control-bg/50 border border-control-border/70 rounded-lg hover:bg-control-bg/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <span className="text-sm font-bold uppercase tracking-wider text-control-text-primary">What is PulZ?</span>
              </div>
              <motion.span
                animate={{ rotate: expandedSection === 'what-is-pulz' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedSection === 'what-is-pulz' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 bg-control-bg/30 border-l-2 border-control-accent rounded-r-lg"
                >
                  <p className="text-sm text-control-text-secondary leading-relaxed">
                    A governed operating layer for company decisions and systems. PulZ ensures that no AI operates silently,
                    no decision is made without evidence, and all actions are auditable.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* What is it NOT */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('what-it-is-not')}
              className="w-full flex items-center justify-between p-4 bg-control-bg/50 border border-control-border/70 rounded-lg hover:bg-control-bg/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⛔</span>
                <span className="text-sm font-bold uppercase tracking-wider text-control-warning">What is it NOT?</span>
              </div>
              <motion.span
                animate={{ rotate: expandedSection === 'what-it-is-not' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedSection === 'what-it-is-not' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 bg-control-bg/30 border-l-2 border-control-warning rounded-r-lg"
                >
                  <ul className="text-sm text-control-text-secondary leading-relaxed space-y-2">
                    <li>
                      • This is <strong>not security</strong>. A knowledgeable user can bypass it.
                    </li>
                    <li>
                      • This is <strong>not authentication</strong>. We&apos;re not verifying identity.
                    </li>
                    <li>
                      • This is <strong>not</strong> a login form for user accounts.
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Why does it exist */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('why-exists')}
              className="w-full flex items-center justify-between p-4 bg-control-bg/50 border border-control-border/70 rounded-lg hover:bg-control-bg/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">❓</span>
                <span className="text-sm font-bold uppercase tracking-wider text-control-text-primary">Why does it exist?</span>
              </div>
              <motion.span animate={{ rotate: expandedSection === 'why-exists' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedSection === 'why-exists' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 bg-control-bg/30 border-l-2 border-control-accent rounded-r-lg"
                >
                  <p className="text-sm text-control-text-secondary leading-relaxed">
                    To prevent silent operation and ensure human awareness. Before using the system, we want you to
                    understand its purpose and limitations.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* What happens if I proceed */}
          <div className="mb-8">
            <button
              onClick={() => toggleSection('what-happens')}
              className="w-full flex items-center justify-between p-4 bg-control-bg/50 border border-control-border/70 rounded-lg hover:bg-control-bg/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <span className="text-sm font-bold uppercase tracking-wider text-control-text-primary">
                  What happens if I proceed?
                </span>
              </div>
              <motion.span
                animate={{ rotate: expandedSection === 'what-happens' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedSection === 'what-happens' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 bg-control-bg/30 border-l-2 border-control-success rounded-r-lg"
                >
                  <p className="text-sm text-control-text-secondary leading-relaxed">
                    You are entering a simulated control environment. You will see the governance interface, decision tools,
                    and learning library. This is a demonstration of how AI can be governed, not a production system.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Acknowledgment */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="border-t border-control-border/50 pt-8"
          >
            <form onSubmit={handleEnter} className="space-y-6">
              <div className="flex items-start gap-3">
                <input
                  id="acknowledge"
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="w-4 h-4 mt-1 rounded border-control-border bg-control-bg/50 text-control-accent focus:ring-control-accent/30"
                />
                <label htmlFor="acknowledge" className="text-sm text-control-text-secondary cursor-pointer leading-relaxed">
                  I understand this is a demo control environment.
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-control-border bg-control-bg/50 text-control-accent focus:ring-control-accent/30"
                />
                <label htmlFor="remember" className="text-sm text-control-text-secondary cursor-pointer">
                  Remember this acknowledgment for 7 days
                </label>
              </div>

              <button
                type="submit"
                disabled={!acknowledged}
                className="w-full px-6 py-4 bg-control-accent/20 border border-control-accent/50 text-control-accent rounded-lg font-bold uppercase tracking-wider hover:bg-control-accent/30 hover:border-control-accent/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-control-accent/20 disabled:hover:border-control-accent/50"
              >
                Enter PulZ System
              </button>

              <p className="text-xs text-control-text-muted text-center">
                This demo does not use accounts, passwords, or recovery.
              </p>
            </form>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <p className="text-[10px] text-control-text-muted uppercase tracking-wider">
            Operator Boundary &bull; Not Security &bull; Awareness First
          </p>
        </motion.div>
      </div>
    </div>
  )
}
