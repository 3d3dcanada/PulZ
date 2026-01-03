'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const DemoTimeline = () => {
  const points = [40, 65, 45, 80, 55, 90, 70];
  
  return (
    <div className="h-24 w-full flex items-end gap-1 px-2">
      {points.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
          className="flex-1 bg-control-accent/40 hover:bg-control-accent/60 transition-colors rounded-t-sm"
          title={`Value: ${h}`}
        />
      ))}
    </div>
  );
};

export const ConfidenceDistribution = () => {
  const slices = [
    { label: 'High (90+)', value: 45, color: 'bg-green-500/50' },
    { label: 'Med (50-89)', value: 35, color: 'bg-yellow-500/50' },
    { label: 'Low (<50)', value: 20, color: 'bg-red-500/50' },
  ];

  return (
    <div className="flex flex-col gap-2">
      {slices.map((slice, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-tighter text-control-text-secondary">
            <span>{slice.label}</span>
            <span>{slice.value}%</span>
          </div>
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${slice.value}%` }}
              transition={{ delay: i * 0.2, duration: 1 }}
              className={`h-full ${slice.color}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MachineUtilization = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map((id) => (
        <div key={id} className="p-2 bg-black/20 border border-control-accent/10 rounded">
          <div className="text-[9px] text-control-text-secondary mb-1">UNIT #{id}00</div>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${id % 3 === 0 ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] text-control-text-primary uppercase font-mono">
              {id % 3 === 0 ? 'Wait' : 'Active'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const WidgetCard = ({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) => (
  <div className="p-4 rounded-lg bg-glass-morphism border border-control-accent/20 flex flex-col gap-3">
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-control-accent">{title}</h4>
      <p className="text-[10px] text-control-text-secondary uppercase">{subtitle}</p>
    </div>
    {children}
    <div className="text-[9px] text-control-text-secondary/50 italic mt-auto">
      * Demo signals, not live telemetry.
    </div>
  </div>
);
