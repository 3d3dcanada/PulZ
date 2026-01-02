'use client'

import { motion } from 'framer-motion'
import SystemMap from '@/components/SystemMap'

const deploymentPaths = [
  {
    title: 'Cloud Hosting',
    icon: '☁️',
    options: [
      'NVIDIA NIM for Nemotron',
      'Anthropic API for Claude',
      'OpenAI API for GPT',
      'Google Vertex for Gemini',
      'Groq for fast inference',
    ],
    pros: 'Managed scale, minimal ops',
    cons: 'API costs, vendor dependency',
  },
  {
    title: 'Local Inference',
    icon: '🖥️',
    options: [
      'Nemotron via local GPU',
      'Llama via Ollama',
      'Open-source alternatives',
      'Full data sovereignty',
    ],
    pros: 'One-time cost, 100% privacy',
    cons: 'Hardware reqs, manual ops',
  },
  {
    title: 'Hybrid / Mesh',
    icon: '🔀',
    options: [
      'Local for routing/classifying',
      'Cloud for complex reasoning',
      'Multi-provider fallback',
      'Cost-optimized routing',
    ],
    pros: 'Resilient, cost-controlled',
    cons: 'Higher orchestration complexity',
  },
]

const deploymentChecklist = [
  { item: 'Model API keys configured', critical: true },
  { item: 'Database setup (PostgreSQL)', critical: true },
  { item: 'Memory store initialized', critical: true },
  { item: 'Ingestion connectors configured', critical: false },
  { item: 'Circuit breaker limits set', critical: true },
  { item: 'Audit log storage provisioned', critical: true },
  { item: 'User authentication enabled', critical: true },
  { item: 'Morning brief schedule set', critical: false },
]

export default function DeployPage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <SystemMap />

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
          <h2 className="text-2xl font-bold mb-8 text-control-accent text-center">
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
                <div className="text-3xl mb-4 text-center">{path.icon}</div>
                <h3 className="text-lg font-bold mb-6 text-control-text-primary text-center">
                  {path.title}
                </h3>
                
                <div className="mb-6 flex-grow">
                  <h4 className="text-[10px] font-bold text-control-accent mb-3 uppercase tracking-widest opacity-70 text-center">
                    Infrastructure Options
                  </h4>
                  <ul className="space-y-2">
                    {path.options.map((option, idx) => (
                      <li key={idx} className="flex items-center text-xs">
                        <span className="text-control-accent mr-2 opacity-50">→</span>
                        <span className="text-control-text-secondary">{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="glass-panel p-3 bg-control-success/5 border-control-success/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-control-success uppercase tracking-widest opacity-80">Pros</span>
                    <span className="text-[10px] text-control-text-muted text-right max-w-[120px] leading-tight">{path.pros}</span>
                  </div>
                  <div className="glass-panel p-3 bg-control-error/5 border-control-error/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-control-error uppercase tracking-widest opacity-80">Cons</span>
                    <span className="text-[10px] text-control-text-muted text-right max-w-[120px] leading-tight">{path.cons}</span>
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
            <div className="grid md:grid-cols-2 gap-4">
              {deploymentChecklist.map((item, index) => (
                <motion.div
                  key={item.item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between glass-panel p-4 bg-black/20 border-white/5"
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded border border-control-accent/50 mr-3 flex items-center justify-center flex-shrink-0">
                      <span className="text-control-accent text-[10px]">✓</span>
                    </div>
                    <span className="text-sm text-control-text-secondary font-medium">
                      {item.item}
                    </span>
                  </div>
                  {item.critical && (
                    <span className="px-2 py-0.5 bg-control-error/10 text-control-error text-[10px] font-bold rounded uppercase tracking-tighter">
                      Critical
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                phase: 'P1: Foundation',
                items: ['Kernel & memory', 'Validation engine', 'Claude (Primary)', 'Manual briefs'],
              },
              {
                phase: 'P2: Safety',
                items: ['4-Gate active', 'Circuit breakers', 'Scoring engine', 'Audit logging'],
              },
              {
                phase: 'P3: Consensus',
                items: ['GPT-4 Critique', 'Gemini Consensus', 'Agreement maps', 'Conflict UI'],
              },
              {
                phase: 'P4: Lanes',
                items: ['Connectors active', 'Lane workflows', 'Feed ingestion', 'Full automation'],
              },
            ].map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel-bright p-6 border-t-2 border-t-control-accent"
              >
                <div className="text-[10px] font-bold text-control-accent uppercase tracking-[0.2em] mb-3">
                  {phase.phase}
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item, idx) => (
                    <li key={idx} className="text-xs text-control-text-muted flex items-start">
                      <span className="text-control-accent mr-2 opacity-50">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel-bright p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-control-accent to-transparent" />
          <h2 className="text-3xl font-bold mb-6 text-gradient">
            Build with PulZ
          </h2>
          <p className="text-control-text-secondary mb-10 max-w-2xl mx-auto text-sm leading-relaxed">
            PulZ is an open specification for trustworthy AI orchestration. 
            This control room artifact demonstrates the model that ensures safety, 
            consensus, and human authority in every operation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/3D3D/PulZ"
              target="_blank"
              rel="noopener noreferrer"
              className="control-button px-8"
            >
              Source Repo
            </a>
            <a
              href="https://3d3d.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="control-button px-8 border-control-accent/30"
            >
              About 3D3D
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
