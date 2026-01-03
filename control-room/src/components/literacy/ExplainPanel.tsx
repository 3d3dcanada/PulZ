'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Shield, Activity, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export type ExplainerType = 'EvidenceItem' | 'EvidenceReport' | 'DecisionFrame' | 'AuditEvent' | 'EndpointSlot';

interface ExplainPanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: ExplainerType;
  data?: any;
}

const explainers: Record<ExplainerType, {
  title: string;
  icon: React.ReactNode;
  sections: { label: string; content: string; icon?: React.ReactNode }[];
}> = {
  EvidenceItem: {
    title: 'Evidence Item',
    icon: <FileText className="w-5 h-5" />,
    sections: [
      { label: 'What it is', content: 'A single atomic piece of data used to support a decision. It could be an email, a sensor reading, or a code snippet.' },
      { label: 'Why it exists', content: 'To provide verifiable grounding for AI claims. Without evidence, a claim is just a hallucination.' },
      { label: 'What it affects', content: 'It contributes to the overall Confidence Score of a Decision Frame.' },
    ]
  },
  EvidenceReport: {
    title: 'Evidence Report',
    icon: <Shield className="w-5 h-5" />,
    sections: [
      { label: 'What it is', content: 'A collection of Evidence Items that have been analyzed together to reach a conclusion.' },
      { label: 'Why it exists', content: 'To aggregate multiple sources of truth before taking an action.' },
      { label: 'What confidence means', content: 'A high score (90+) means the evidence is overwhelming and consistent. A low score (<50) means the evidence is conflicting or missing.' },
    ]
  },
  DecisionFrame: {
    title: 'Decision Frame',
    icon: <CheckCircle2 className="w-5 h-5" />,
    sections: [
      { label: 'What it is', content: 'A structured proposal for an action, containing the proposed change, the evidence for it, and the confidence level.' },
      { label: 'What happens if approved', content: 'The system will execute the proposed action (e.g., deploy code, send an email, move a robotic arm).' },
      { label: 'What happens if rejected', content: 'The action is blocked, and the system must find better evidence or a different path.' },
    ]
  },
  AuditEvent: {
    title: 'Audit Event',
    icon: <Activity className="w-5 h-5" />,
    sections: [
      { label: 'What it is', content: 'An immutable record of a state change in the system.' },
      { label: 'Why it exists', content: 'To ensure accountability. We can always trace back who did what, when, and based on what evidence.' },
      { label: 'Integrity', content: 'Each event is cryptographically linked to the previous one, making it impossible to delete or alter history without detection.' },
    ]
  },
  EndpointSlot: {
    title: 'Endpoint Slot',
    icon: <Info className="w-5 h-5" />,
    sections: [
      { label: 'What it is', content: 'A placeholder for a specific AI model or tool integration (e.g., Claude 3.5, GPT-4o, NVIDIA NIM).' },
      { label: 'Why it exists', content: 'To allow the system to swap models or providers without changing the underlying governance logic.' },
      { label: 'Configuration', content: 'Each slot holds the necessary API keys and parameters to talk to the provider.' },
    ]
  }
};

export default function ExplainPanel({ isOpen, onClose, type, data }: ExplainPanelProps) {
  const explainer = explainers[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-control-bg border-l border-control-accent/30 shadow-2xl z-[101] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-control-accent/10 rounded-lg text-control-accent">
                    {explainer.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-control-text-primary">
                    Explain: {explainer.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-control-accent/10 rounded-full transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5 text-control-text-secondary" />
                </button>
              </div>

              {data && (
                <div className="mb-8 p-4 bg-black/30 rounded-lg border border-control-accent/10 font-mono text-xs overflow-hidden">
                  <div className="text-control-text-secondary mb-2 uppercase tracking-wider">Object Context</div>
                  <pre className="text-control-accent overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-6">
                {explainer.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-control-accent flex items-center gap-2">
                      {section.icon || <Info className="w-3 h-3" />}
                      {section.label}
                    </h3>
                    <p className="text-control-text-secondary leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-4 rounded-lg bg-control-accent/5 border border-control-accent/20">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-control-accent shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-control-text-primary mb-1">Governance Note</h4>
                    <p className="text-xs text-control-text-secondary">
                      This explanation is provided to ensure operator literacy. All system objects are subject to the PulZ Governance Kernel invariants.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
