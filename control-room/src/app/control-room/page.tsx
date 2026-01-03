'use client'

import { motion } from 'framer-motion'
import Tooltip from '@/components/literacy/Tooltip'
import ExplainPanel, { type ExplainerType } from '@/components/literacy/ExplainPanel'
import { Info } from 'lucide-react'
import { useState } from 'react'

const OPPORTUNITY_FEED = [
  {
    id: 'opp-104',
    title: 'Municipal RFP: Rapid tooling prototypes',
    relevance: 92,
    urgency: '48h',
    reversibility: 'reversible',
    profit_potential: '$18.4k',
    confidence: 84,
  },
  {
    id: 'opp-105',
    title: 'Inbound quote: Carbon fiber jig',
    relevance: 78,
    urgency: '72h',
    reversibility: 'reversible',
    profit_potential: '$4.2k',
    confidence: 71,
  },
  {
    id: 'opp-106',
    title: 'Vendor alert: material cost spike',
    relevance: 88,
    urgency: '24h',
    reversibility: 'irreversible',
    profit_potential: 'Risk mitigation',
    confidence: 67,
  },
]

const DRAFTS_WAITING = [
  {
    id: 'draft-201',
    title: 'Approve quote bundle for ACME',
    actionClass: 'B',
    approvalState: 'awaiting_single_approval',
    evidenceTier: 'tier_2',
  },
  {
    id: 'draft-202',
    title: 'Material contract renegotiation',
    actionClass: 'C',
    approvalState: 'awaiting_multi_gate',
    evidenceTier: 'tier_3',
  },
]

const ACTION_LOG = [
  { id: 'log-91', label: 'Morning brief delivered', status: 'logged', actionClass: 'A' },
  { id: 'log-92', label: 'Quote rejected (low confidence)', status: 'blocked', actionClass: 'B' },
  { id: 'log-93', label: 'Tender draft approved', status: 'approved', actionClass: 'C' },
]

const LEARNING_SUMMARIES = [
  {
    id: 'learn-01',
    headline: 'Vendor response time trending up',
    takeaway: 'Shift 20% of urgent jobs to secondary maker pool.',
  },
  {
    id: 'learn-02',
    headline: 'Quote conversion lift on bundled materials',
    takeaway: 'Bundle carbon fiber + finishing in default proposal.',
  },
]

export default function ControlRoomPage() {
  const [isExplainOpen, setIsExplainOpen] = useState(false)
  const [explainType, setExplainType] = useState<ExplainerType>('ActionClass')
  const [explainData, setExplainData] = useState<any>(null)

  const openExplain = (type: ExplainerType, data: any) => {
    setExplainType(type)
    setExplainData(data)
    setIsExplainOpen(true)
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            PulZ Control Room
          </h1>
          <p className="text-lg text-control-text-secondary max-w-3xl leading-relaxed">
            Governance-first operations console. All signals are inspectable, routed through action class
            gates, and waiting on explicit human approval where required.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Opportunity Feed</h2>
              <span className="text-xs uppercase tracking-widest text-control-text-muted">Sensed items</span>
            </div>
            <div className="space-y-4">
              {OPPORTUNITY_FEED.map((item) => (
                <div key={item.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-control-text-primary font-semibold">{item.title}</div>
                      <div className="text-xs text-control-text-muted flex flex-wrap gap-4">
                        <span>Relevance: {item.relevance}%</span>
                        <span>Urgency: {item.urgency}</span>
                        <span>Reversibility: {item.reversibility}</span>
                        <span>Profit potential: {item.profit_potential}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-control-text-muted uppercase tracking-widest">Confidence</div>
                      <div className="text-control-success font-bold">{item.confidence}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Drafts Waiting Approval</h2>
              <span className="text-xs uppercase tracking-widest text-control-text-muted">Human gate</span>
            </div>
            <div className="space-y-4">
              {DRAFTS_WAITING.map((draft) => (
                <div key={draft.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-control-text-primary font-semibold">{draft.title}</div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Tooltip content="Action class determines which approval gates apply.">
                          <span className="px-2 py-0.5 rounded bg-control-accent/20 text-control-accent font-bold">
                            Type {draft.actionClass}
                          </span>
                        </Tooltip>
                        <Tooltip content="Evidence tier indicates the quality of supporting proof.">
                          <span className="px-2 py-0.5 rounded bg-control-surface text-control-text-secondary">
                            {draft.evidenceTier}
                          </span>
                        </Tooltip>
                      </div>
                    </div>
                    <button
                      onClick={() => openExplain('ApprovalState', draft)}
                      className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                      title="Explain approval state"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-control-text-muted">
                    Approval state: <span className="text-control-text-primary font-mono">{draft.approvalState}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel-bright p-6"
          >
            <h2 className="text-xl font-bold text-control-accent mb-6">Approved / Blocked / Logged</h2>
            <div className="space-y-3">
              {ACTION_LOG.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-control-text-primary">{entry.label}</div>
                    <div className="text-xs text-control-text-muted">Action Class {entry.actionClass}</div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    entry.status === 'approved'
                      ? 'text-control-success'
                      : entry.status === 'blocked'
                      ? 'text-control-error'
                      : 'text-control-text-muted'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Learning Summaries</h2>
              <button
                onClick={() => openExplain('EvidenceTier', null)}
                className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                title="Explain evidence tiers"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {LEARNING_SUMMARIES.map((item) => (
                <div key={item.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                  <div className="text-control-text-primary font-semibold">{item.headline}</div>
                  <div className="text-xs text-control-text-secondary mt-2">{item.takeaway}</div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Governance Surface</h2>
              <button
                onClick={() => openExplain('ActionClass', null)}
                className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                title="Explain action classes"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-control-text-secondary">
              <div className="p-4 rounded-lg bg-black/20 border border-control-border">
                <div className="text-control-text-primary font-semibold">Human Gate Enforcement</div>
                <p className="text-xs mt-2">
                  No action proceeds without a recorded approval artifact. Action class determines
                  whether single or multi-gate approval is required.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-black/20 border border-control-border">
                <div className="text-control-text-primary font-semibold">Audit Preview</div>
                <p className="text-xs mt-2">
                  Every state change is appended to an immutable log. Each entry includes evidence
                  references and confidence deltas.
                </p>
              </div>
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel-bright p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-control-accent">Operator Literacy Layer</h2>
            <button
              onClick={() => openExplain('ModelRoute', null)}
              className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
              title="Explain model routing"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-control-text-secondary">
            <div className="p-4 rounded-lg bg-black/20 border border-control-border">
              <div className="text-control-text-primary font-semibold">Explain this</div>
              <p className="mt-2">Hover or tap the info icons to see plain-language explanations for every object.</p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-control-border">
              <div className="text-control-text-primary font-semibold">Decision Flow</div>
              <p className="mt-2">Visual flow maps show exactly which approval gate you are in and why.</p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-control-border">
              <div className="text-control-text-primary font-semibold">Audit-ready output</div>
              <p className="mt-2">Every recommendation includes provenance, evidence tier, and confidence targets.</p>
            </div>
          </div>
        </motion.section>
      </div>

      <ExplainPanel
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        type={explainType}
        data={explainData}
      />
    </div>
  )
}
