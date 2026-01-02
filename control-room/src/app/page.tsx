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
    title: 'Kernel-Enforced Governance',
    description: 'Structural invariants make silent execution impossible. Code-level enforcement, not UI language.',
    href: '/governance',
    icon: '⚖️',
    color: 'gate-evidence',
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
  { label: 'One daily conversation', value: 'Focus preserved' },
  { label: 'No hallucinations', value: 'Evidence grounded' },
  { label: 'No stupid questions', value: 'Context aware' },
  { label: 'Maximum time back', value: 'Decision ready' },
]

export default function Home() {
  return (
    <div className="pt-16">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-control-accent/10 via-transparent to-transparent opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-control-accent/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gate-consensus/5 rounded-full blur-[120px] animate-pulse" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-block px-4 py-1.5 mb-8 glass-panel border-white/10">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-control-accent">
                The Orchestration OS
              </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter">
              <span className="text-gradient">PulZ</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-control-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              A governance-first orchestration system for autonomous business operations. 
              Built for trust, designed for durability.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Link href="/philosophy" className="control-button px-10 py-4 text-base">
                Investor Walkthrough
              </Link>
              <Link href="/architecture" className="control-button px-10 py-4 text-base border-white/10 hover:border-white/20">
                System Architecture
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {principles.map((principle, index) => (
              <motion.div
                key={principle.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="glass-panel p-6 border-white/5"
              >
                <div className="text-control-accent text-[10px] font-bold uppercase tracking-widest mb-2">
                  {principle.label}
                </div>
                <div className="text-control-text-primary text-xs font-medium">
                  {principle.value}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Governance by Design
            </h2>
            <p className="text-control-text-secondary max-w-2xl mx-auto text-lg font-light leading-relaxed">
              Every component is engineered to reinforce human authority through 
              multi-gate validation and transparent evidence grounding.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Link href={feature.href} className="block group h-full">
                  <div className="glass-panel-bright p-10 h-full hover:border-control-accent/40 transition-all duration-500 group-hover:bg-white/[0.08]">
                    <div className="text-4xl mb-6 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500">{feature.icon}</div>
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-control-accent transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-control-text-secondary leading-relaxed font-light">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[center_top_-1px]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-8 tracking-tight">
              Absolute Human Authority
            </h2>
            <p className="text-xl text-control-text-secondary mb-12 leading-relaxed font-light">
              PulZ never acts without verified evidence. It surfaces conflicts instead of hiding them. 
              It is built for businesses where accountability is non-negotiable.
            </p>
            <div className="flex justify-center gap-4">
               <div className="h-[1px] w-12 bg-control-accent/50 self-center" />
               <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-control-text-muted">Gated Execution</span>
               <div className="h-[1px] w-12 bg-control-accent/50 self-center" />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
