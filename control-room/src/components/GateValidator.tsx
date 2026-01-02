'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

type GateStatus = 'pending' | 'processing' | 'pass' | 'fail'

interface Gate {
  id: number
  name: string
  status: GateStatus
  color: string
}

const initialGates: Gate[] = [
  { id: 1, name: 'Structural', status: 'pending', color: '#3b82f6' },
  { id: 2, name: 'Evidence', status: 'pending', color: '#8b5cf6' },
  { id: 3, name: 'Consistency', status: 'pending', color: '#06b6d4' },
  { id: 4, name: 'Consensus', status: 'pending', color: '#10b981' },
]

export default function GateValidator() {
  const [gates, setGates] = useState<Gate[]>(initialGates)
  const [isRunning, setIsRunning] = useState(false)
  const [currentGate, setCurrentGate] = useState(0)

  const runValidation = async () => {
    setIsRunning(true)
    setGates(initialGates)
    setCurrentGate(0)

    for (let i = 0; i < gates.length; i++) {
      setCurrentGate(i)
      
      setGates((prev) =>
        prev.map((gate, idx) =>
          idx === i ? { ...gate, status: 'processing' } : gate
        )
      )

      await new Promise((resolve) => setTimeout(resolve, 1500))

      const passed = Math.random() > 0.2
      setGates((prev) =>
        prev.map((gate, idx) =>
          idx === i ? { ...gate, status: passed ? 'pass' : 'fail' } : gate
        )
      )

      if (!passed) {
        setIsRunning(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsRunning(false)
  }

  const reset = () => {
    setGates(initialGates)
    setCurrentGate(0)
    setIsRunning(false)
  }

  const allPassed = gates.every((gate) => gate.status === 'pass')
  const anyFailed = gates.some((gate) => gate.status === 'fail')

  return (
    <div className="glass-panel-bright p-8">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold mb-4 text-control-accent">
          Interactive Gate Validation
        </h3>
        <p className="text-control-text-secondary mb-6">
          Watch how an output progresses through all four gates sequentially.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={runValidation}
            disabled={isRunning}
            className="control-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Validating...' : 'Run Validation'}
          </button>
          <button
            onClick={reset}
            disabled={isRunning}
            className="control-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {gates.map((gate, index) => (
          <motion.div
            key={gate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className={`glass-panel p-6 text-center transition-all duration-500 ${
                gate.status === 'processing'
                  ? 'border-control-accent ring-1 ring-control-accent/20'
                  : gate.status === 'pass'
                  ? 'border-control-success ring-1 ring-control-success/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : gate.status === 'fail'
                  ? 'border-control-error ring-1 ring-control-error/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                  : 'border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
              }`}
            >
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center border border-white/5 shadow-inner"
                style={{
                  backgroundColor:
                    gate.status === 'pending'
                      ? 'rgba(255,255,255,0.03)'
                      : gate.status === 'processing'
                      ? `${gate.color}15`
                      : gate.status === 'pass'
                      ? '#10b98115'
                      : '#ef444415',
                }}
              >
                <AnimatePresence mode="wait">
                  {gate.status === 'pending' && (
                    <motion.span
                      key="pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-control-text-muted"
                    >
                      ○
                    </motion.span>
                  )}
                  {gate.status === 'processing' && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 360 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
                      className="w-6 h-6 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: gate.color }}
                    />
                  )}
                  {gate.status === 'pass' && (
                    <motion.span
                      key="pass"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="text-control-success text-2xl"
                    >
                      ✓
                    </motion.span>
                  )}
                  {gate.status === 'fail' && (
                    <motion.span
                      key="fail"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="text-control-error text-2xl"
                    >
                      ✕
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div
                className="text-lg font-bold mb-1 tracking-tight"
                style={{
                  color:
                    gate.status === 'pass'
                      ? '#10b981'
                      : gate.status === 'fail'
                      ? '#ef4444'
                      : gate.status === 'processing'
                      ? gate.color
                      : 'rgba(255,255,255,0.4)',
                }}
              >
                Gate {gate.id}
              </div>
              <div className="text-sm text-control-text-muted">{gate.name}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {allPassed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-6 bg-control-success/10 border-control-success text-center"
          >
            <div className="text-2xl mb-2">✓</div>
            <div className="text-control-success font-bold mb-2">
              All Gates Passed
            </div>
            <div className="text-control-text-muted text-sm">
              Output is validated and ready for action or storage
            </div>
          </motion.div>
        )}
        {anyFailed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-6 bg-control-error/10 border-control-error text-center"
          >
            <div className="text-2xl mb-2">✕</div>
            <div className="text-control-error font-bold mb-2">
              Gate {currentGate + 1} Failed
            </div>
            <div className="text-control-text-muted text-sm">
              Output rejected. Regenerate or escalate to human.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
