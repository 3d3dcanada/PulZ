'use client'

import { motion } from 'framer-motion'
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
      <p className="text-control-text-secondary mb-8 text-center">
        The quote lane demonstrates how PulZ handles real business operations
        with validation, routing, and approval at each stage.
      </p>

      <div className="space-y-4">
        {steps.map((stepData, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <button
              onClick={() => setActiveStep(activeStep === index ? null : index)}
              className="w-full text-left"
            >
              <div
                className={`glass-panel p-6 cursor-pointer transition-all duration-300 ${
                  activeStep === index ? 'border-control-accent' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="flex items-center flex-grow">
                    <div className="w-12 h-12 rounded-lg bg-control-accent/20 flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-2xl">{stepData.icon}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center mb-1">
                        <span className="text-control-accent font-bold text-sm mr-2">
                          Step {index + 1}
                        </span>
                        <h3 className="text-lg font-bold text-control-text-primary">
                          {stepData.step}
                        </h3>
                      </div>
                      <p className="text-control-text-muted text-sm">
                        {stepData.description}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: activeStep === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-control-accent ml-4"
                  >
                    ▼
                  </motion.div>
                </div>

                {activeStep === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-control-border/50"
                  >
                    <div className="glass-panel p-4 bg-control-bg/60">
                      <h4 className="text-sm font-semibold text-control-accent mb-2">
                        DETAILED PROCESS
                      </h4>
                      <div className="text-sm text-control-text-muted">
                        {getStepDetails(index)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </button>

            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="w-0.5 h-8 bg-gradient-to-b from-control-accent to-control-border" />
              </div>
            )}
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
