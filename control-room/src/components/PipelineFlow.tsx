'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const stages = [
  { name: 'Input', color: '#3b82f6', shortDesc: 'Ingest' },
  { name: 'Normalize', color: '#8b5cf6', shortDesc: 'Structure' },
  { name: 'Plan', color: '#06b6d4', shortDesc: 'Strategy' },
  { name: 'Execute', color: '#10b981', shortDesc: 'Run' },
  { name: 'Validate', color: '#f59e0b', shortDesc: 'Gates' },
  { name: 'Store', color: '#ec4899', shortDesc: 'Memory' },
  { name: 'Brief', color: '#10b981', shortDesc: 'Output' },
]

export default function PipelineFlow() {
  const [activeStage, setActiveStage] = useState<number | null>(null)

  return (
    <div className="glass-panel-bright p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-8">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center w-full md:w-auto flex-grow">
            <motion.button
              onClick={() => setActiveStage(activeStage === index ? null : index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group w-full md:w-auto flex-grow focus:outline-none"
            >
              <div
                className={`glass-panel p-4 cursor-pointer transition-all duration-300 border-white/5 ${
                  activeStage === index ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="text-center relative z-10">
                  <div
                    className="text-sm font-bold mb-1 tracking-tight"
                    style={{ color: stage.color }}
                  >
                    {stage.name}
                  </div>
                  <div className="text-[9px] font-bold text-control-text-muted uppercase tracking-widest">
                    {stage.shortDesc}
                  </div>
                </div>
              </div>
            </motion.button>
            
            {index < stages.length - 1 && (
              <motion.div
                className="hidden md:block w-4 h-px bg-white/10 mx-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeStage !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-panel p-6 bg-black/40 border-white/5 border-t-2"
            style={{ borderTopColor: stages[activeStage].color }}
          >
            <h3
              className="text-lg font-bold mb-3 tracking-tight"
              style={{ color: stages[activeStage].color }}
            >
              {stages[activeStage].name} Stage
            </h3>
            <p className="text-sm text-control-text-secondary leading-relaxed">
              {getStageDescription(stages[activeStage].name)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getStageDescription(stageName: string): string {
  const descriptions: Record<string, string> = {
    Input: 'Multiple ingestion sources (email, forms, tenders, manual conversation) feed into PulZ. Each input type has its own connector and parser.',
    Normalize: 'Raw inputs are converted into standard internal objects: QuoteRequest, TenderOpportunity, WebsiteTask, VendorEmail, or DecisionRequest. This ensures consistent processing.',
    Plan: 'Generate 2-4 strategic options (not 25). Each strategy includes predicted cost, time, and risk. The system selects the best plan within hard constraints.',
    Execute: 'Run the selected plan with strict budgets. Tool calls are counted, tokens are metered, costs are tracked. Circuit breakers prevent runaway execution.',
    Validate: 'Every output passes through four gates: structural (schema), evidence (citations), consistency (no contradictions), and consensus (multi-model critique).',
    Store: 'Results, evidence, citations, costs, and learned patterns are stored in the memory system. Audit logs are append-only and immutable.',
    Brief: 'Generate decision-ready output: what changed, what matters, what needs approval, risks, and opportunities. This is your morning conversation.',
  }
  return descriptions[stageName] || ''
}
