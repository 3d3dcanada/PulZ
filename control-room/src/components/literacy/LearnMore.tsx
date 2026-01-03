'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface LearnMoreProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function LearnMore({ title, children, defaultOpen = false }: LearnMoreProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-control-accent/20 rounded-lg overflow-hidden bg-glass-morphism mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-control-accent/5 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-control-accent" />
          <span className="font-medium text-control-text-primary">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <ChevronDown className="w-4 h-4 text-control-text-secondary" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="p-4 pt-0 text-sm text-control-text-secondary border-t border-control-accent/10 bg-black/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
