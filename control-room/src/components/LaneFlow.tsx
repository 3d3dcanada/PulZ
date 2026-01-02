'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const steps = [
  {
    step: 'Customer Quote',
    description: 'Form submission with specs, files, material choice',
    icon: '📝',
  },
  {
    step: 'Normalize',
    description: 'Convert to QuoteRequest object, validate schema',
    icon: '🔄',
  },
  {
    step: 'Route to Maker',
    description: 'Match by capability, capacity, quality score',
    icon: '🎯',
  },
  {
    step: 'Calculate Credits',
    description: 'Price → credit conversion, maker/platform split',
    icon: '💳',
  },
  {
    step: 'Approval Gate',
    description: 'User reviews quote, approves or adjusts',
    icon: '✓',
  },
  {
    step: 'Production',
    description: 'Maker receives job, credits locked until delivery',
    icon: '🏭',
  },
]

export default function LaneFlow() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <div className="glass-panel-bright p-8">
      <p className="text-control-text-secondary mb-12 text-center text-sm max-w-xl mx-auto leading-relaxed">
        The quote lane demonstrates how PulZ handles business operations
        with multi-stage validation and explicit human authority.
      </p>

      <div className="space-y-3">
        {steps.map((stepData, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
          >
            <button
              onClick={() => setActiveStep(activeStep === index ? null : index)}
              className="w-full text-left focus:outline-none group"
            >
              <div
                className={`glass-panel p-5 cursor-pointer transition-all duration-300 border-white/5 ${
                  activeStep === index ? 'border-control-accent bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex items-center flex-grow">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 border border-white/5 ${activeStep === index ? 'bg-control-accent text-white' : 'bg-white/5 text-control-text-muted'}`}>
                      <span className="text-lg">{stepData.icon}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center mb-0.5">
                        <span className="text-control-accent font-mono text-[10px] font-bold mr-2 uppercase tracking-tighter">
                          Stage 0{index + 1}
                        </span>
                        <h3 className={`text-sm font-bold transition-colors ${activeStep === index ? 'text-control-accent' : 'text-control-text-primary'}`}>
                          {stepData.step}
                        </h3>
                      </div>
                      <p className="text-control-text-muted text-[11px] leading-tight">
                        {stepData.description}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: activeStep === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`ml-4 text-xs ${activeStep === index ? 'text-control-accent' : 'text-control-text-muted'}`}
                  >
                    ▼
                  </motion.div>
                </div>

                <AnimatePresence>
                  {activeStep === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="glass-panel p-4 bg-black/40 border-white/5">
                          <h4 className="text-[10px] font-bold text-control-accent mb-2 uppercase tracking-[0.2em]">
                            System Trace
                          </h4>
                          <div className="text-[11px] text-control-text-secondary leading-relaxed">
                            {getStepDetails(index)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function getStepDetails(step: number): string {
  const details = [
    'Customer fills out quote form with file upload (.STL, .STEP, etc.), selects material (PLA, PETG, ABS, resin), quantity, and delivery timeline. Form data is captured and immediately validated for completeness.',
    'Raw form data is converted into a standard QuoteRequest object with fields: customer_id, files[], material, quantity, delivery_date, special_notes. Schema validation (Gate 1) checks all required fields are present and correct types.',
    'PulZ queries the maker database for available makers with matching capabilities (material type, printer size, quality rating). Filters by current capacity and delivery feasibility. Produces ranked list of candidate makers.',
    'Quote price is converted to platform credits. For example: $450 quote = 450 credits. Platform takes 15%, maker receives 85%. Credit allocation is logged for audit trail. No actual transfer until customer payment confirmed.',
    'User (admin) sees quote in morning brief with: customer details, specs, recommended maker, credit breakdown, delivery timeline. User can approve as-is, adjust pricing, or reject. No action proceeds without explicit approval.',
    'Once approved, maker receives job notification. Credits are locked in escrow. Maker uploads progress photos. Upon delivery confirmation, credits are released to maker account. QC failure triggers refund protocol.',
  ]
  return details[step] || ''
}
