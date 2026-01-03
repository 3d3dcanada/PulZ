'use client'

import { motion } from 'framer-motion'
import SystemMap from '@/components/SystemMap'
import DecisionFrameDemo from '@/components/DecisionFrameDemo'
import AuditViewer from '@/components/AuditViewer'
import Tooltip from '@/components/literacy/Tooltip'

export default function GovernancePage() {
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
            Kernel-Enforced Governance
          </h1>
          <p className="text-xl text-control-text-secondary mb-12 leading-relaxed">
            PulZ&apos;s governance is not enforced by UI language. It is enforced by code and data flow. 
            This page demonstrates structural invariants that make it impossible to silently execute or 
            bypass approval gates.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Core Invariants
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel-bright p-6">
              <h3 className="text-lg font-bold mb-3 text-gate-structural">
                No Silent Execution
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                The &ldquo;executed&rdquo; state requires an explicit approval artifact. A decision cannot 
                transition to approved status without both{' '}
                <Tooltip content="The identity of the human operator who authorized this action.">
                  <code className="text-control-accent cursor-help">approver_id</code>
                </Tooltip>{' '}
                and{' '}
                <Tooltip content="The precise moment (ISO 8601) when approval was granted.">
                  <code className="text-control-accent cursor-help">approval_timestamp</code>
                </Tooltip>. The kernel validator rejects 
                any attempt to bypass this.
              </p>
            </div>

            <div className="glass-panel-bright p-6">
              <h3 className="text-lg font-bold mb-3 text-gate-evidence">
                Evidence Gating
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                Every recommendation must reference an{' '}
                <Tooltip content="An immutable document aggregating all verified facts supporting a proposed action.">
                  <code className="text-control-accent cursor-help">EvidenceReport</code>
                </Tooltip>. 
                Claims without evidence must be explicitly labeled as Configurable Assumptions. The system cannot 
                recommend actions based on unverified assertions.
              </p>
            </div>

            <div className="glass-panel-bright p-6">
              <h3 className="text-lg font-bold mb-3 text-gate-consistency">
                Confidence Gating
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                Confidence scores constrain allowable outcomes. Below 50: blocked. 50-89: approval required, 
                reversible only. 90+: automation-eligible only if explicitly enabled. The policy is code, not 
                configuration.
              </p>
            </div>

            <div className="glass-panel-bright p-6">
              <h3 className="text-lg font-bold mb-3 text-gate-consensus">
                Append-Only Audit
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                Every state change produces an{' '}
                <Tooltip content="A cryptographically-chained record of a single state transition in the system.">
                  <code className="text-control-accent cursor-help">AuditEvent</code>
                </Tooltip>{' '}
                with 
                cryptographic hashes linking to the previous event. No destructive edits. No silent modifications. 
                The audit trail is verifiable and tamper-evident.
              </p>
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
            Interactive Demo
          </h2>
          <DecisionFrameDemo />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-control-accent">
            Audit Trail
          </h2>
          <AuditViewer />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel-bright p-8 border-l-4 border-control-accent"
        >
          <h2 className="text-2xl font-bold mb-6 text-control-accent">
            What PulZ Will Never Do
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2 text-control-error">
                ✗ Execute without approval
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                Even if confidence is 100%, even if all gates pass, the kernel requires <code>approval_required: true</code>. 
                There is no code path that allows silent execution.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2 text-control-error">
                ✗ Recommend without evidence
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                Every <code>DecisionFrame</code> must reference an <code>EvidenceReport</code>. 
                If evidence is insufficient, the confidence score drops below thresholds and actions are blocked.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2 text-control-error">
                ✗ Rewrite decision history
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                The <code>AppendOnlyLog</code> only appends. Revocation is a new event, not a deletion. 
                The full history remains traceable and verifiable via cryptographic hash chain.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2 text-control-error">
                ✗ Allow invalid status transitions
              </h3>
              <p className="text-sm text-control-text-secondary leading-relaxed">
                Status transitions are validated by <code>governancePolicy</code>. You cannot go from 
                &ldquo;rejected&rdquo; to &ldquo;approved&rdquo;. You cannot approve without going through 
                &ldquo;pending_review&rdquo;. The state machine is enforced.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
