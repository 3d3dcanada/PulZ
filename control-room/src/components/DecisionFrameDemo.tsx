'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  createEvidenceItem,
  createEvidenceReport,
  createDecisionFrame,
  approveDecisionFrame,
  rejectDecisionFrame,
  transitionToReview,
  calculateConfidenceScore,
  evaluateConfidencePolicy,
  validateDecisionFrame,
  runAllGovernanceChecks,
  globalAuditLog,
  type EvidenceReport,
  type DecisionFrame,
} from '../../kernel'
import Tooltip from './literacy/Tooltip'
import ExplainPanel, { ExplainerType } from './literacy/ExplainPanel'
import { Info } from 'lucide-react'
import { WidgetCard, DemoTimeline, ConfidenceDistribution } from './literacy/VisualWidgets'

export default function DecisionFrameDemo() {
  const [evidenceReport, setEvidenceReport] = useState<EvidenceReport | null>(null)
  const [decisionFrame, setDecisionFrame] = useState<DecisionFrame | null>(null)
  const [step, setStep] = useState<'evidence' | 'decision' | 'review' | 'complete'>('evidence')
  const [explainType, setExplainType] = useState<ExplainerType | null>(null)
  const [explainData, setExplainData] = useState<any>(null)

  const openExplainer = (type: ExplainerType, data?: any) => {
    setExplainType(type)
    setExplainData(data)
  }

  useEffect(() => {
    createInitialEvidence()
  }, [])

  const createInitialEvidence = () => {
    const items = [
      createEvidenceItem({
        id: 'ev-1',
        type: 'document',
        source: { kind: 'pulz-bible', ref: 'section-2.3' },
        excerpt: 'All decisions require explicit human approval',
        confidence_weight: 0.9,
        verified: true,
      }),
      createEvidenceItem({
        id: 'ev-2',
        type: 'system_observation',
        source: { kind: 'validation-gate', ref: 'evidence-gate' },
        excerpt: 'Evidence gate passed with 4 verified sources',
        confidence_weight: 0.85,
        verified: true,
      }),
      createEvidenceItem({
        id: 'ev-3',
        type: 'user_input',
        source: { kind: 'user-preference', ref: 'config-001' },
        excerpt: 'Prefer conservative approval thresholds',
        confidence_weight: 0.8,
        verified: true,
      }),
    ]

    const confidence = calculateConfidenceScore(items)
    
    const report = createEvidenceReport({
      id: 'report-demo-1',
      items,
      coverage_summary: 'All governance requirements covered by verified sources',
      confidence_score: confidence,
      limitations: ['Demo context only', 'Simplified evidence chain'],
      assumptions: ['User has reviewed PulZ Bible', 'Current governance policy active'],
    })

    setEvidenceReport(report)

    globalAuditLog.append({
      event_type: 'evidence_report_created',
      actor: { type: 'system' },
      related: { kind: 'EvidenceReport', id: report.id },
      snapshot_before: null,
      snapshot_after: report,
      notes: 'Initial evidence report generated for demo',
    })
  }

  const createDecision = () => {
    if (!evidenceReport) return

    const frame = createDecisionFrame({
      id: 'decision-demo-1',
      objective: 'Demonstrate kernel-enforced governance with approval gate',
      recommendation: 'Show how evidence gating and confidence scoring prevent silent execution',
      evidence_report_id: evidenceReport.id,
      confidence_score: evidenceReport.confidence_score,
    })

    const validation = validateDecisionFrame(frame)
    if (!validation.valid) {
      console.error('Invalid decision frame:', validation.errors)
      return
    }

    setDecisionFrame(frame)
    setStep('decision')

    globalAuditLog.append({
      event_type: 'decision_frame_created',
      actor: { type: 'system' },
      related: { kind: 'DecisionFrame', id: frame.id },
      snapshot_before: null,
      snapshot_after: frame,
      notes: 'Decision frame created with evidence backing',
    })
  }

  const submitForReview = () => {
    if (!decisionFrame) return

    const updated = transitionToReview(decisionFrame)
    setDecisionFrame(updated)
    setStep('review')

    globalAuditLog.append({
      event_type: 'decision_submitted_for_review',
      actor: { type: 'system' },
      related: { kind: 'DecisionFrame', id: updated.id },
      snapshot_before: decisionFrame,
      snapshot_after: updated,
      notes: 'Transitioned to pending_review status',
    })
  }

  const handleApprove = () => {
    if (!decisionFrame) return

    const governanceCheck = runAllGovernanceChecks(decisionFrame)
    if (!governanceCheck.passed) {
      alert('Governance violations:\n' + governanceCheck.violations.join('\n'))
      return
    }

    const approved = approveDecisionFrame(decisionFrame, 'demo-user')
    setDecisionFrame(approved)
    setStep('complete')

    globalAuditLog.append({
      event_type: 'decision_approved',
      actor: { type: 'human', id: 'demo-user' },
      related: { kind: 'DecisionFrame', id: approved.id },
      snapshot_before: decisionFrame,
      snapshot_after: approved,
      notes: 'Decision approved by human authority',
    })
  }

  const handleReject = () => {
    if (!decisionFrame) return

    const rejected = rejectDecisionFrame(decisionFrame, 'demo-user')
    setDecisionFrame(rejected)
    setStep('complete')

    globalAuditLog.append({
      event_type: 'decision_rejected',
      actor: { type: 'human', id: 'demo-user' },
      related: { kind: 'DecisionFrame', id: rejected.id },
      snapshot_before: decisionFrame,
      snapshot_after: rejected,
      notes: 'Decision rejected by human authority',
    })
  }

  const reset = () => {
    setStep('evidence')
    setEvidenceReport(null)
    setDecisionFrame(null)
    createInitialEvidence()
  }

  const policy = decisionFrame ? evaluateConfidencePolicy(decisionFrame.confidence_score) : null

  return (
    <div className="space-y-6">
      <div className="glass-panel-bright p-8">
        <h3 className="text-xl font-bold mb-6 text-control-accent">
          Kernel-Enforced Governance Demo
        </h3>
        
        <div className="flex items-center space-x-4 mb-8">
          {(['evidence', 'decision', 'review', 'complete'] as const).map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  step === s
                    ? 'bg-control-accent text-white'
                    : idx < ['evidence', 'decision', 'review', 'complete'].indexOf(step)
                    ? 'bg-control-success text-white'
                    : 'bg-control-surface text-control-text-muted'
                }`}
              >
                {idx + 1}
              </div>
              <div className="ml-3 flex-1">
                <div className={`text-sm font-semibold ${
                  step === s ? 'text-control-accent' : 'text-control-text-muted'
                }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {step === 'evidence' && evidenceReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WidgetCard title="Tender Intake" subtitle="Signals over time">
                <DemoTimeline />
              </WidgetCard>
              <WidgetCard title="Source Verification" subtitle="Distribution">
                <div className="h-24 flex items-center">
                  <ConfidenceDistribution />
                </div>
              </WidgetCard>
            </div>

            <div className="glass-panel p-6 bg-black/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-control-accent">Evidence Report</h4>
                <button
                  onClick={() => openExplainer('EvidenceReport', evidenceReport)}
                  className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-control-text-muted">ID:</span>{' '}
                  <Tooltip content="Unique identifier for this specific evidence collection.">
                    <span className="font-mono text-control-text-primary">{evidenceReport.id}</span>
                  </Tooltip>
                </div>
                <div>
                  <span className="text-control-text-muted">Items:</span>{' '}
                  <span className="text-control-text-primary">{evidenceReport.items.length}</span>
                </div>
                <div>
                  <span className="text-control-text-muted">Confidence Score:</span>{' '}
                  <Tooltip content="Weighted aggregate of all evidence reliability. Score > 90 is required for automation.">
                    <span className="text-control-success font-bold">{evidenceReport.confidence_score}/100</span>
                  </Tooltip>
                </div>
                <div>
                  <span className="text-control-text-muted">Coverage:</span>{' '}
                  <span className="text-control-text-primary">{evidenceReport.coverage_summary}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-control-border">
                <div className="text-xs text-control-text-muted mb-2 uppercase tracking-widest">Evidence Items:</div>
                {evidenceReport.items.map((item) => (
                  <div key={item.id} className="mb-2 p-2 glass-panel text-xs relative group">
                    <button
                      onClick={() => openExplainer('EvidenceItem', item)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-control-accent/10 rounded text-control-text-secondary"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-control-accent font-semibold">{item.type}</span>
                      <span className={item.verified ? 'text-control-success' : 'text-control-warning'}>
                        {item.verified ? '✓ Verified' : '○ Unverified'}
                      </span>
                    </div>
                    <div className="text-control-text-muted">
                      {item.source.kind}: {item.source.ref}
                    </div>
                    <div className="text-control-text-secondary mt-1 italic">
                      &ldquo;{item.excerpt}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={createDecision}
              className="w-full py-3 glass-panel hover:bg-control-accent/20 transition-all text-control-accent font-semibold border border-control-accent/30"
            >
              Create Decision Frame →
            </button>
          </motion.div>
        )}

        {step === 'decision' && decisionFrame && policy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="glass-panel p-6 bg-black/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-control-accent">Decision Frame</h4>
                <button
                  onClick={() => openExplainer('DecisionFrame', decisionFrame)}
                  className="p-1 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-control-text-muted">Objective:</span>
                  <p className="text-control-text-primary mt-1">{decisionFrame.objective}</p>
                </div>
                <div>
                  <span className="text-control-text-muted">Recommendation:</span>
                  <p className="text-control-text-primary mt-1">{decisionFrame.recommendation}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-control-border">
                  <div>
                    <span className="text-control-text-muted text-xs uppercase tracking-widest">Confidence:</span>
                    <Tooltip content="Inherited from the evidence report. Score must be > 90 to bypass human review.">
                      <div className="text-control-success font-bold">{decisionFrame.confidence_score}/100</div>
                    </Tooltip>
                  </div>
                  <div>
                    <span className="text-control-text-muted text-xs uppercase tracking-widest">Risk Level:</span>
                    <Tooltip content="Categorization of the potential impact of this decision on the overall system.">
                      <div className={`font-bold ${
                        decisionFrame.risk_level === 'low' ? 'text-control-success' :
                        decisionFrame.risk_level === 'medium' ? 'text-control-warning' :
                        'text-control-error'
                      }`}>
                        {decisionFrame.risk_level.toUpperCase()}
                      </div>
                    </Tooltip>
                  </div>
                </div>
                <div>
                  <span className="text-control-text-muted text-xs uppercase tracking-widest">Status:</span>
                  <div className="font-mono text-control-text-primary">{decisionFrame.status}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-control-border">
                <div className="text-xs text-control-text-muted mb-2 uppercase tracking-widest">Confidence Policy Evaluation:</div>
                <div className="p-3 glass-panel text-xs space-y-2">
                  <div className="text-control-text-secondary leading-relaxed">{policy.reasoning}</div>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={policy.requires_approval ? 'text-control-warning' : 'text-control-success'}>
                      {policy.requires_approval ? '⚠ Approval Required' : '✓ No Approval Needed'}
                    </span>
                    <span className={policy.can_automate ? 'text-control-success' : 'text-control-text-muted'}>
                      {policy.can_automate ? '✓ Automation Eligible' : '○ Manual Only'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={submitForReview}
              className="w-full py-3 glass-panel hover:bg-control-accent/20 transition-all text-control-accent font-semibold border border-control-accent/30"
            >
              Submit for Review →
            </button>
          </motion.div>
        )}

        {step === 'review' && decisionFrame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="glass-panel p-6 bg-black/20 border-l-4 border-control-warning">
              <h4 className="font-semibold mb-4 text-control-warning">⚠ Human Approval Required</h4>
              <p className="text-sm text-control-text-secondary mb-4">
                This decision requires explicit human approval. The kernel prevents silent execution.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-control-text-muted">Approval Required:</span>
                  <span className="text-control-error font-bold">
                    {decisionFrame.approval_required ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-control-text-muted">Blocked Actions:</span>
                  <span className="text-control-text-primary font-mono">
                    {decisionFrame.blocked_actions.join(', ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-control-text-muted">Allowed Actions:</span>
                  <span className="text-control-text-primary font-mono">
                    {decisionFrame.allowed_actions.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleApprove}
                className="py-3 glass-panel hover:bg-control-success/20 transition-all text-control-success font-semibold border border-control-success/30"
              >
                ✓ Approve
              </button>
              <button
                onClick={handleReject}
                className="py-3 glass-panel hover:bg-control-error/20 transition-all text-control-error font-semibold border border-control-error/30"
              >
                ✗ Reject
              </button>
            </div>
          </motion.div>
        )}

        {step === 'complete' && decisionFrame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className={`glass-panel p-6 border-l-4 ${
              decisionFrame.status === 'approved' ? 'border-control-success' : 'border-control-error'
            }`}>
              <h4 className={`font-semibold mb-4 ${
                decisionFrame.status === 'approved' ? 'text-control-success' : 'text-control-error'
              }`}>
                {decisionFrame.status === 'approved' ? '✓ Decision Approved' : '✗ Decision Rejected'}
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-control-text-muted">Status:</span>{' '}
                  <span className="font-mono text-control-text-primary">{decisionFrame.status}</span>
                </div>
                <div>
                  <span className="text-control-text-muted">Approver:</span>{' '}
                  <span className="text-control-text-primary">{decisionFrame.approver_id}</span>
                </div>
                <div>
                  <span className="text-control-text-muted">Timestamp:</span>{' '}
                  <span className="text-control-text-primary font-mono text-xs">
                    {decisionFrame.approval_timestamp}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full py-3 glass-panel hover:bg-control-surface/60 transition-all text-control-accent font-semibold"
            >
              ⟲ Reset Demo
            </button>
          </motion.div>
        )}
      </div>

      <ExplainPanel 
        isOpen={!!explainType} 
        onClose={() => setExplainType(null)} 
        type={explainType || 'EvidenceItem'} 
        data={explainData}
      />
    </div>
  )
}
