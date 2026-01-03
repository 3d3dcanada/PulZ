'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Shield, Zap, FileText, Factory, Cpu, Hammer, Search, Info } from 'lucide-react';
import ExplainPanel, { ExplainerType } from '@/components/literacy/ExplainPanel';
import LearnMore from '@/components/literacy/LearnMore';

export default function LibraryPage() {
  const [explainType, setExplainType] = useState<ExplainerType | null>(null);

  const sections = [
    {
      id: 'governance',
      title: 'Governance & Protocols',
      icon: <Shield className="w-5 h-5 text-blue-400" />,
      description: 'The core rules that prevent AI from taking unauthorized actions.',
      actions: 'View invariants, adjust thresholds, review kernel logs.',
      required: 'Kernel access key, Operator authorization.',
      explainer: 'DecisionFrame' as ExplainerType
    },
    {
      id: 'learning',
      title: 'Learning & Incidents',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      description: 'Historical record of system failures and the structural fixes applied.',
      actions: 'Search incident log, verify protocol adherence.',
      required: 'Incident ID or time range.',
      explainer: 'AuditEvent' as ExplainerType
    },
    {
      id: 'tenders',
      title: 'Tenders (Demo)',
      icon: <FileText className="w-5 h-5 text-green-400" />,
      description: 'Ingested project opportunities and contract requirements.',
      actions: 'Analyze requirements, match capabilities, draft responses.',
      required: 'PDF/DOCX ingestion or manual URI.',
      explainer: 'EvidenceReport' as ExplainerType
    },
    {
      id: 'manufacturing',
      title: 'Manufacturing & Utilization (Demo)',
      icon: <Factory className="w-5 h-5 text-purple-400" />,
      description: 'Real-time and historical data from the production floor.',
      actions: 'Monitor printer status, track filament usage, view job queue.',
      required: 'IoT Gateway connection, machine IDs.',
      explainer: 'EvidenceItem' as ExplainerType
    },
    {
      id: 'robotics',
      title: 'Robotics & Electronics (Demo)',
      icon: <Cpu className="w-5 h-5 text-red-400" />,
      description: 'Control and telemetry for automated assembly lines.',
      actions: 'Calibrate sensors, test actuator responses, view error codes.',
      required: 'Hardware abstraction layer, low-latency link.',
      explainer: 'EndpointSlot' as ExplainerType
    },
    {
      id: 'tools',
      title: 'Tool Registry (Placeholder)',
      icon: <Hammer className="w-5 h-5 text-gray-400" />,
      description: 'Catalog of approved physical and digital tools available to the system.',
      actions: 'Register new tool, update capabilities, set safety bounds.',
      required: 'Tool manifest, safety certification.',
      explainer: 'EvidenceItem' as ExplainerType
    }
  ];

  return (
    <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Book className="w-8 h-8 text-control-accent" />
          <h1 className="text-4xl font-bold text-control-text-primary tracking-tight">System Library</h1>
        </div>
        <p className="text-lg text-control-text-secondary max-w-2xl leading-relaxed">
          The company middle-layer knowledge base. A unified repository for governance, operations, and technical documentation.
        </p>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-control-text-secondary" />
        <input 
          type="text" 
          placeholder="Search library, protocols, or machine data..." 
          className="w-full bg-glass-morphism border border-control-accent/20 rounded-xl py-4 pl-12 pr-4 text-control-text-primary focus:outline-none focus:ring-2 focus:ring-control-accent/50 transition-all shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group p-6 rounded-2xl bg-glass-morphism border border-control-accent/20 hover:border-control-accent/50 transition-all flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-control-accent/10 rounded-xl group-hover:scale-110 transition-transform">
                {section.icon}
              </div>
              <button
                onClick={() => setExplainType(section.explainer)}
                className="p-2 hover:bg-control-accent/10 rounded-full transition-colors text-control-text-secondary hover:text-control-accent"
                title="Explain this section"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-control-text-primary mb-2 group-hover:text-control-accent transition-colors">
              {section.title}
            </h3>
            <p className="text-sm text-control-text-secondary mb-6 flex-grow">
              {section.description}
            </p>

            <div className="space-y-4 pt-4 border-t border-control-accent/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-control-accent block mb-1">What you can do</span>
                <p className="text-xs text-control-text-secondary">{section.actions}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-control-accent block mb-1">Data Required</span>
                <p className="text-xs text-control-text-secondary">{section.required}</p>
              </div>
            </div>

            <button className="mt-8 w-full py-3 px-4 bg-control-accent/10 hover:bg-control-accent/20 border border-control-accent/30 rounded-lg text-sm font-medium text-control-accent transition-all flex items-center justify-center gap-2">
              Access Sub-Library
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-16">
        <LearnMore title="Why is the Library separated from the Control Room?">
          <p>
            The Control Room is for real-time orchestration and high-stakes decision making. The Library serves as the long-term memory and context provider. By separating concern, we ensure that operators are not overwhelmed by documentation while trying to manage active AI processes, while still maintaining 1-click access to the &quot;why&quot; behind every system object.
          </p>
        </LearnMore>
      </div>

      <ExplainPanel 
        isOpen={!!explainType} 
        onClose={() => setExplainType(null)} 
        type={explainType || 'EvidenceItem'} 
      />
    </div>
  );
}
