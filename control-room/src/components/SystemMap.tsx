'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

const steps = [
  { href: '/', label: 'Control Room' },
  { href: '/philosophy', label: 'Philosophy' },
  { href: '/architecture', label: 'Architecture' },
  { href: '/safety', label: 'Safety' },
  { href: '/confidence', label: 'Confidence' },
  { href: '/consensus', label: 'Consensus' },
  { href: '/lanes', label: 'Lanes' },
  { href: '/deploy', label: 'Deploy' },
]

export default function SystemMap() {
  const pathname = usePathname()
  const currentIndex = steps.findIndex(step => pathname === step.href || (step.href !== '/' && pathname?.startsWith(step.href)))

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-control-accent">
          System Walkthrough
        </span>
        <span className="text-[10px] font-mono text-control-text-muted">
          {currentIndex + 1} / {steps.length}
        </span>
      </div>
      <div className="relative h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="absolute inset-y-0 left-0 bg-control-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      </div>
      <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2">
        {steps.map((step, index) => {
          const isActive = currentIndex === index
          const isPast = currentIndex > index
          return (
            <Link
              key={step.href}
              href={step.href}
              className={`text-[9px] text-center transition-all duration-300 truncate uppercase tracking-tighter ${
                isActive
                  ? 'text-control-accent font-bold scale-110'
                  : isPast
                  ? 'text-control-text-secondary opacity-80'
                  : 'text-control-text-muted hover:text-control-text-secondary opacity-50 hover:opacity-100'
              }`}
            >
              {step.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
