'use client'

import { motion } from 'framer-motion'

const deploymentPaths = [
  {
    title: 'Cloud Hosting',
    icon: '☁️',
    options: [
      'NVIDIA NIM for Nemotron models',
      'Anthropic API for Claude',
      'OpenAI API for GPT',
      'Google Vertex AI for Gemini',
      'Groq for fast inference',
    ],
    pros: 'Managed infrastructure, auto-scaling, minimal ops overhead',
    cons: 'Ongoing API costs, vendor dependency',
  },
  {
    title: 'Local Inference',
    icon: '🖥️',
    options: [
      'Run Nemotron locally (requires GPU)',
      'Llama models via Ollama',
      'Open-source model alternatives',
      'Full data control',
    ],
    pros: 'One-time hardware cost, full privacy, no rate limits',
    cons: 'GPU requirements, model updates manual, ops complexity',
  },
  {
    title: 'Hybrid Approach',
    icon: '🔀',
    options: [
      'Local models for classification/routing',
      'Cloud models for complex reasoning',
      'Fallback between providers',
      'Cost-optimized routing',
    ],
    pros: 'Best of both worlds, cost control, resilience',
    cons: 'More complex architecture, requires orchestration',
  },
]

const deploymentChecklist = [
  { item: 'Model API keys configured', critical: true },
  { item: 'Database setup (PostgreSQL recommended)', critical: true },
  { item: 'Memory store initialized', critical: true },
  { item: 'Ingestion connectors configured (email, forms)', critical: false },
  { item: 'Circuit breaker limits set', critical: true },
  { item: 'Audit log storage provisioned', critical: true },
  { item: 'User authentication enabled', critical: true },
  { item: 'Morning brief schedule configured', critical: false },
]

export default function DeployPage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Deployment
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            PulZ is designed to be cloud-agnostic and deployment-flexible.
            Choose the path that matches your scale, budget, and privacy requirements.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Deployment Paths
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {deploymentPaths.map((path, index) => (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6 flex flex-col"
              >
                <div className="text-4xl mb-4 text-center">{path.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-control-text-primary text-center">
                  {path.title}
                </h3>
                
                <div className="mb-4 flex-grow">
                  <h4 className="text-sm font-semibold text-control-accent mb-2">
                    OPTIONS
                  </h4>
                  <ul className="space-y-2">
                    {path.options.map((option, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="text-control-accent mr-2">→</span>
                        <span className="text-control-text-muted">{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="glass-panel p-3 bg-control-success/10">
                    <div className="text-xs font-semibold text-control-success mb-1">
                      PROS
                    </div>
                    <div className="text-xs text-control-text-muted">
                      {path.pros}
                    </div>
                  </div>
                  <div className="glass-panel p-3 bg-control-error/10">
                    <div className="text-xs font-semibold text-control-error mb-1">
                      CONS
                    </div>
                    <div className="text-xs text-control-text-muted">
                      {path.cons}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Pre-Deployment Checklist
          </h2>
          <div className="glass-panel-bright p-8">
            <div className="space-y-4">
              {deploymentChecklist.map((item, index) => (
                <motion.div
                  key={item.item}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between glass-panel p-4"
                >
                  <div className="flex items-center flex-grow">
                    <div className="w-6 h-6 rounded border-2 border-control-accent mr-4 flex items-center justify-center flex-shrink-0">
                      <span className="text-control-accent text-xs">□</span>
                    </div>
                    <span className="text-control-text-secondary">
                      {item.item}
                    </span>
                  </div>
                  {item.critical && (
                    <span className="px-3 py-1 bg-control-error/20 text-control-error text-xs font-semibold rounded ml-4">
                      CRITICAL
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Phased Rollout
          </h2>
          <div className="space-y-6">
            {[
              {
                phase: 'Phase 1: Foundation',
                items: [
                  'Kernel + memory system',
                  'Validation engine',
                  'Single model (Claude)',
                  'Manual brief generation',
                ],
              },
              {
                phase: 'Phase 2: Safety',
                items: [
                  'Four-gate validation active',
                  'Circuit breakers enabled',
                  'Confidence scoring',
                  'Audit logging',
                ],
              },
              {
                phase: 'Phase 3: Consensus',
                items: [
                  'Add GPT-4 critique',
                  'Add Gemini consensus',
                  'Agreement mapping',
                  'Conflict resolution UI',
                ],
              },
              {
                phase: 'Phase 4: Business Lanes',
                items: [
                  'Email connector',
                  'Quote form integration',
                  'Tender feed ingestion',
                  'Morning brief automation',
                ],
              },
            ].map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6"
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-lg bg-control-accent/20 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-control-accent font-bold text-xl">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold mb-3 text-control-text-primary">
                      {phase.phase}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {phase.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-sm text-control-text-muted"
                        >
                          <span className="text-control-accent mr-2">✓</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel-bright p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-4 text-control-accent">
            Ready to Build?
          </h2>
          <p className="text-control-text-secondary mb-6 max-w-2xl mx-auto">
            PulZ is a specification, not yet executable code. This control room
            demonstrates the governance model, validation gates, and operational philosophy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/3D3D/PulZ"
              target="_blank"
              rel="noopener noreferrer"
              className="control-button"
            >
              View on GitHub
            </a>
            <a
              href="https://3d3d.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="control-button border-control-accent/50"
            >
              Learn About 3D3D
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
