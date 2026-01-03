'use client'

import { motion } from 'framer-motion'
import Tooltip from '@/components/literacy/Tooltip'
import ExplainPanel, { type ExplainerType } from '@/components/literacy/ExplainPanel'
import { Info } from 'lucide-react'
import { useMemo, useState } from 'react'

type Opportunity = {
  id: string
  description: string
  source: string
  urgency: string
  reversibility: string
  estimatedMaterial: string
  estimatedPrintTime: string
  riskLevel: string
  profitPotential: string
  category: string
}

type DraftResponse = {
  id: string
  title: string
  customer: string
  price: string
  eta: string
  nextStep: string
  approvalState: string
  evidenceTier: string
  actionClass: string
}

type JobRecord = {
  id: string
  title: string
  status: string
  stage: string
  customer: string
  revenue: string
  cost: string
  margin: string
}

const INTAKE_SEED: Opportunity[] = [
  {
    id: 'opp-301',
    description: 'Replacement gear for a lab centrifuge (discontinued part).',
    source: 'Referral · Local lab',
    urgency: '72h',
    reversibility: 'reversible',
    estimatedMaterial: 'PETG-CF · 180g',
    estimatedPrintTime: '6h',
    riskLevel: 'medium',
    profitPotential: '$480',
    category: 'Replacement parts',
  },
  {
    id: 'opp-302',
    description: 'Custom bracket for a woodworking dust extractor retrofit.',
    source: 'Forum lead · Sawmill Creek',
    urgency: '5d',
    reversibility: 'reversible',
    estimatedMaterial: 'ASA · 220g',
    estimatedPrintTime: '5h',
    riskLevel: 'low',
    profitPotential: '$320',
    category: 'Mounts & adapters',
  },
]

const ACTIVE_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-305',
    description: '3D printed enclosure for Raspberry Pi sensor array.',
    source: 'Inbound · Local maker space',
    urgency: '48h',
    reversibility: 'reversible',
    estimatedMaterial: 'ASA · 140g',
    estimatedPrintTime: '4h',
    riskLevel: 'low',
    profitPotential: '$210',
    category: 'Enclosures',
  },
  {
    id: 'opp-306',
    description: 'Jig for aligning aluminum tubing in fabrication shop.',
    source: 'Job board · MakersLine',
    urgency: '24h',
    reversibility: 'reversible',
    estimatedMaterial: 'PETG · 260g',
    estimatedPrintTime: '7h',
    riskLevel: 'medium',
    profitPotential: '$520',
    category: 'Jigs & fixtures',
  },
  {
    id: 'opp-307',
    description: 'Replacement knob for an industrial mixer (heat resistant).',
    source: 'Inbound · Email',
    urgency: '72h',
    reversibility: 'reversible',
    estimatedMaterial: 'Polycarbonate · 90g',
    estimatedPrintTime: '3h',
    riskLevel: 'medium',
    profitPotential: '$180',
    category: 'Replacement parts',
  },
]

const DRAFTS_WAITING: DraftResponse[] = [
  {
    id: 'draft-401',
    title: 'Centrifuge gear replacement',
    customer: 'Brighton Labs',
    price: '$480 + shipping',
    eta: '5 business days',
    nextStep: 'Await CAD confirmation + photos for tooth count.',
    approvalState: 'awaiting_single_approval',
    evidenceTier: 'tier_2',
    actionClass: 'B',
  },
  {
    id: 'draft-402',
    title: 'Dust extractor retrofit bracket',
    customer: 'Lopez Woodworks',
    price: '$320 + shipping',
    eta: '4 business days',
    nextStep: 'Confirm mounting hole spacing before print.',
    approvalState: 'awaiting_single_approval',
    evidenceTier: 'tier_2',
    actionClass: 'B',
  },
]

const PRICING_BREAKDOWN = [
  {
    id: 'price-01',
    label: 'Material cost',
    detail: 'PETG-CF · 180g',
    amount: '$42',
  },
  {
    id: 'price-02',
    label: 'Print time',
    detail: '6h @ $18/hr',
    amount: '$108',
  },
  {
    id: 'price-03',
    label: 'Post-processing',
    detail: 'Deburr + fit test · 1.5h',
    amount: '$45',
  },
  {
    id: 'price-04',
    label: 'Shipping estimate',
    detail: 'USPS Priority',
    amount: '$14',
  },
  {
    id: 'price-05',
    label: 'Risk buffer',
    detail: 'Material failure allowance',
    amount: '$36',
  },
]

const CONSTRAINTS = [
  {
    id: 'constraint-01',
    title: 'Material suitability',
    detail: 'Polycarbonate reserved for heat >90°C. PETG for general duty.',
  },
  {
    id: 'constraint-02',
    title: 'Strength & orientation',
    detail: 'Layer orientation must align with load path. Rotate in slicer if needed.',
  },
  {
    id: 'constraint-03',
    title: 'Lead time',
    detail: 'Printer availability: 2 slots open in next 48h window.',
  },
]

const JOBS: JobRecord[] = [
  {
    id: 'job-501',
    title: 'Pi sensor enclosure',
    status: 'Approved',
    stage: 'Printing',
    customer: 'Maker Space',
    revenue: '$210',
    cost: '$62',
    margin: '$148',
  },
  {
    id: 'job-502',
    title: 'Aluminum tubing jig',
    status: 'Approved',
    stage: 'Post-processing',
    customer: 'FabLab West',
    revenue: '$520',
    cost: '$150',
    margin: '$370',
  },
  {
    id: 'job-503',
    title: 'Mixer knob replacement',
    status: 'Drafted',
    stage: 'Awaiting approval',
    customer: 'Kilo Foods',
    revenue: '$180',
    cost: '$54',
    margin: '$126',
  },
]

const LEARNING_SUMMARIES = [
  {
    id: 'learn-01',
    headline: 'PETG-CF prints failed at 40% infill',
    takeaway: 'Raise default infill to 55% for functional gears.',
  },
  {
    id: 'learn-02',
    headline: 'Quote conversions highest with ETA under 5 days',
    takeaway: 'Prioritize shorter lead time jobs when queue exceeds 3 slots.',
  },
]

const INVESTOR_EXPORT = [
  {
    id: 'export-01',
    label: 'Total revenue (last 30 days)',
    value: '$910',
  },
  {
    id: 'export-02',
    label: 'Average margin',
    value: '64%',
  },
  {
    id: 'export-03',
    label: 'Repeat customers',
    value: '2',
  },
  {
    id: 'export-04',
    label: 'Failure learnings logged',
    value: '3',
  },
]

export default function ControlRoomPage() {
  const [isExplainOpen, setIsExplainOpen] = useState(false)
  const [explainType, setExplainType] = useState<ExplainerType>('ActionClass')
  const [explainData, setExplainData] = useState<any>(null)
  const [intakeQueue, setIntakeQueue] = useState<Opportunity[]>(INTAKE_SEED)
  const [newOpportunity, setNewOpportunity] = useState<Opportunity>({
    id: 'opp-new',
    description: '',
    source: '',
    urgency: '72h',
    reversibility: 'reversible',
    estimatedMaterial: '',
    estimatedPrintTime: '',
    riskLevel: 'low',
    profitPotential: '',
    category: 'Replacement parts',
  })

  const openExplain = (type: ExplainerType, data: any) => {
    setExplainType(type)
    setExplainData(data)
    setIsExplainOpen(true)
  }

  const totalRevenue = useMemo(() => {
    return JOBS.reduce((sum, job) => sum + Number(job.revenue.replace(/[^0-9.]/g, '')), 0)
  }, [])

  const totalMargin = useMemo(() => {
    return JOBS.reduce((sum, job) => sum + Number(job.margin.replace(/[^0-9.]/g, '')), 0)
  }, [])

  const handleIntakeChange = (field: keyof Opportunity, value: string) => {
    setNewOpportunity((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddOpportunity = () => {
    if (!newOpportunity.description.trim()) {
      return
    }

    const entry: Opportunity = {
      ...newOpportunity,
      id: `opp-${Date.now()}`,
    }

    setIntakeQueue((prev) => [entry, ...prev])
    setNewOpportunity({
      id: 'opp-new',
      description: '',
      source: '',
      urgency: '72h',
      reversibility: 'reversible',
      estimatedMaterial: '',
      estimatedPrintTime: '',
      riskLevel: 'low',
      profitPotential: '',
      category: 'Replacement parts',
    })
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
            Demand-first operations console. Intake real leads, draft responses, price responsibly, and track
            fulfillment to revenue. Every step is inspectable and gated by explicit human approval.
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
              <div>
                <h2 className="text-xl font-bold text-control-accent">Opportunity Intake</h2>
                <p className="text-xs text-control-text-muted">Manual paste, tagged source, structured logging.</p>
              </div>
              <span className="text-xs uppercase tracking-widest text-control-text-muted">Intake queue</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <textarea
                  value={newOpportunity.description}
                  onChange={(event) => handleIntakeChange('description', event.target.value)}
                  placeholder="Paste lead details or paste notes from screenshots."
                  className="w-full min-h-[120px] rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                />
                <input
                  value={newOpportunity.source}
                  onChange={(event) => handleIntakeChange('source', event.target.value)}
                  placeholder="Source (Reddit, forum, referral, local)"
                  className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={newOpportunity.estimatedMaterial}
                    onChange={(event) => handleIntakeChange('estimatedMaterial', event.target.value)}
                    placeholder="Estimated material"
                    className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                  />
                  <input
                    value={newOpportunity.estimatedPrintTime}
                    onChange={(event) => handleIntakeChange('estimatedPrintTime', event.target.value)}
                    placeholder="Estimated print time"
                    className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newOpportunity.urgency}
                    onChange={(event) => handleIntakeChange('urgency', event.target.value)}
                    className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                  >
                    <option value="24h">24h</option>
                    <option value="48h">48h</option>
                    <option value="72h">72h</option>
                    <option value="5d">5d</option>
                    <option value="7d">7d</option>
                  </select>
                  <select
                    value={newOpportunity.reversibility}
                    onChange={(event) => handleIntakeChange('reversibility', event.target.value)}
                    className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                  >
                    <option value="reversible">reversible</option>
                    <option value="irreversible">irreversible</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newOpportunity.riskLevel}
                    onChange={(event) => handleIntakeChange('riskLevel', event.target.value)}
                    className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                  <input
                    value={newOpportunity.profitPotential}
                    onChange={(event) => handleIntakeChange('profitPotential', event.target.value)}
                    placeholder="Profit potential"
                    className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newOpportunity.category}
                    onChange={(event) => handleIntakeChange('category', event.target.value)}
                    className="w-full rounded-lg bg-black/30 border border-control-border p-3 text-sm text-control-text-primary"
                  >
                    <option value="Replacement parts">Replacement parts</option>
                    <option value="Mounts & adapters">Mounts & adapters</option>
                    <option value="Jigs & fixtures">Jigs & fixtures</option>
                    <option value="Enclosures">Enclosures</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddOpportunity}
                    className="rounded-lg bg-control-accent/80 hover:bg-control-accent text-white text-sm font-semibold"
                  >
                    Log opportunity
                  </button>
                </div>
                <div className="text-xs text-control-text-muted">
                  Saved entries are stored as Opportunity objects with demand-first categories.
                </div>
              </div>
              <div className="space-y-4">
                {intakeQueue.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                    <div className="text-control-text-primary font-semibold text-sm">{item.category}</div>
                    <div className="text-xs text-control-text-secondary mt-2">{item.description}</div>
                    <div className="text-xs text-control-text-muted mt-3 grid grid-cols-2 gap-2">
                      <span>Source: {item.source}</span>
                      <span>Urgency: {item.urgency}</span>
                      <span>Reversibility: {item.reversibility}</span>
                      <span>Risk: {item.riskLevel}</span>
                      <span>Material: {item.estimatedMaterial}</span>
                      <span>Print time: {item.estimatedPrintTime}</span>
                      <span>Profit: {item.profitPotential}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Active Opportunities</h2>
              <span className="text-xs uppercase tracking-widest text-control-text-muted">Demand-first</span>
            </div>
            <div className="space-y-4">
              {ACTIVE_OPPORTUNITIES.map((item) => (
                <div key={item.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                  <div className="text-control-text-primary font-semibold text-sm">{item.description}</div>
                  <div className="text-xs text-control-text-secondary mt-2">{item.category}</div>
                  <div className="text-xs text-control-text-muted mt-3 space-y-1">
                    <div>Source: {item.source}</div>
                    <div>Urgency: {item.urgency}</div>
                    <div>Material: {item.estimatedMaterial}</div>
                    <div>Profit potential: {item.profitPotential}</div>
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
            className="lg:col-span-2 glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Draft Responses Awaiting Approval</h2>
              <span className="text-xs uppercase tracking-widest text-control-text-muted">Human gate</span>
            </div>
            <div className="space-y-4">
              {DRAFTS_WAITING.map((draft) => (
                <div key={draft.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-control-text-primary font-semibold">{draft.title}</div>
                      <div className="text-xs text-control-text-secondary">Customer: {draft.customer}</div>
                      <div className="text-xs text-control-text-muted">
                        Price: <span className="text-control-text-primary">{draft.price}</span> · ETA: {draft.eta}
                      </div>
                      <div className="text-xs text-control-text-secondary">Next step: {draft.nextStep}</div>
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

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Quote & Pricing Logic</h2>
              <button
                onClick={() => openExplain('EvidenceTier', null)}
                className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                title="Explain evidence tiers"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {PRICING_BREAKDOWN.map((row) => (
                <div key={row.id} className="flex items-start justify-between text-sm">
                  <div>
                    <div className="text-control-text-primary font-semibold">{row.label}</div>
                    <div className="text-xs text-control-text-muted">{row.detail}</div>
                  </div>
                  <span className="text-control-text-secondary font-bold">{row.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-control-text-muted">
              Margin target: <span className="text-control-text-primary font-semibold">35%</span> · Human override allowed.
            </div>
          </motion.section>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Material & Capability Constraints</h2>
              <button
                onClick={() => openExplain('ActionClass', null)}
                className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                title="Explain action classes"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-control-text-secondary">
              {CONSTRAINTS.map((constraint) => (
                <div key={constraint.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                  <div className="text-control-text-primary font-semibold">{constraint.title}</div>
                  <p className="text-xs mt-2">{constraint.detail}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Fulfillment Tracking</h2>
              <span className="text-xs uppercase tracking-widest text-control-text-muted">Operations proof</span>
            </div>
            <div className="space-y-4">
              {JOBS.map((job) => (
                <div key={job.id} className="p-4 rounded-lg bg-black/20 border border-control-border">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-control-text-primary font-semibold">{job.title}</div>
                      <div className="text-xs text-control-text-muted">Customer: {job.customer}</div>
                    </div>
                    <div className="text-xs text-control-text-muted">
                      Status: <span className="text-control-text-primary font-semibold">{job.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-4 gap-3 text-xs text-control-text-secondary">
                    <div>
                      <div className="uppercase tracking-widest text-[10px] text-control-text-muted">Stage</div>
                      <div className="font-semibold text-control-text-primary">{job.stage}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-widest text-[10px] text-control-text-muted">Revenue</div>
                      <div className="font-semibold text-control-text-primary">{job.revenue}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-widest text-[10px] text-control-text-muted">Cost</div>
                      <div className="font-semibold text-control-text-primary">{job.cost}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-widest text-[10px] text-control-text-muted">Margin</div>
                      <div className="font-semibold text-control-success">{job.margin}</div>
                    </div>
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
            transition={{ delay: 0.7 }}
            className="glass-panel-bright p-6"
          >
            <h2 className="text-xl font-bold text-control-accent mb-6">Revenue Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-control-text-secondary">Total booked revenue</span>
                <span className="text-control-text-primary font-semibold">${totalRevenue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-control-text-secondary">Total margin</span>
                <span className="text-control-success font-semibold">${totalMargin}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-control-text-secondary">Jobs in queue</span>
                <span className="text-control-text-primary font-semibold">{JOBS.length}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-control-text-muted">Profit per job is logged after shipment.</div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-panel-bright p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-control-accent">Learning & Feedback Loop</h2>
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
            transition={{ delay: 0.9 }}
            className="glass-panel-bright p-6"
          >
            <h2 className="text-xl font-bold text-control-accent mb-6">Investor-ready Export</h2>
            <div className="space-y-3 text-sm">
              {INVESTOR_EXPORT.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-control-text-secondary">{item.label}</span>
                  <span className="text-control-text-primary font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-control-text-muted">
              Export includes job history, margins, and failure learnings.
            </div>
          </motion.section>
        </div>
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
