'use client'

import { motion } from 'framer-motion'
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center w-full md:w-auto">
            <motion.button
              onClick={() => setActiveStage(activeStage === index ? null : index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group w-full md:w-auto"
            >
              <div
                className={`glass-panel p-4 md:p-6 cursor-pointer transition-all duration-300 ${
                  activeStage === index ? 'border-2' : 'border'
                }`}
                style={{
                  borderColor: activeStage === index ? stage.color : 'rgba(255,255,255,0.1)',
                }}
              >
                <div className="text-center">
                  <div
                    className="text-lg md:text-xl font-bold mb-1"
                    style={{ color: stage.color }}
                  >
                    {stage.name}
                  </div>
                  <div className="text-xs text-control-text-muted">
                    {stage.shortDesc}
                  </div>
                </div>
                {activeStage === index && (
                  <motion.div
                    layoutId="activeStageGlow"
                    className="absolute inset-0 rounded-lg blur-xl opacity-50"
                    style={{ backgroundColor: stage.color }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
            </motion.button>
            
            {index < stages.length - 1 && (
              <motion.div
                className="hidden md:block w-8 h-0.5 bg-gradient-to-r from-control-border to-control-accent/50 mx-2"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              />
            )}
          </div>
        ))}
      </div>

      {activeStage !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel p-6 bg-control-bg/60"
        >
          <h3
            className="text-xl font-bold mb-3"
            style={{ color: stages[activeStage].color }}
          >
            {stages[activeStage].name} Stage
          </h3>
          <p className="text-control-text-secondary">
            {getStageDescription(stages[activeStage].name)}
          </p>
        </motion.div>
      )}
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
