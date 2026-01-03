'use client'

import { motion } from 'framer-motion'
import { ENDPOINT_SLOTS, getEndpointStats } from '@/config/endpoints'
import Tooltip from '@/components/literacy/Tooltip'
import ExplainPanel from '@/components/literacy/ExplainPanel'
import { Info } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const stats = getEndpointStats()
  const [isExplainOpen, setIsExplainOpen] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null)

  const openExplain = (endpoint: any) => {
    setSelectedEndpoint(endpoint)
    setIsExplainOpen(true)
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Settings
          </h1>
          <p className="text-xl text-control-text-secondary max-w-3xl font-light leading-relaxed">
            Configure external API endpoints and integration settings.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-text-primary mb-2">{stats.total}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Total Slots
            </div>
          </div>
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-success mb-2">{stats.enabled}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Configured
            </div>
          </div>
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-text-secondary mb-2">{stats.disabled}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Disabled
            </div>
          </div>
          <div className="glass-panel p-6 text-center">
            <div className="text-3xl font-bold text-control-warning mb-2">{stats.requiresSecret}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-control-text-muted">
              Require Secrets
            </div>
          </div>
        </motion.div>

        {/* Endpoint Slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-3">
            <span className="text-control-accent">🔌</span>
            API Endpoint Slots
          </h2>
          
          <div className="space-y-4">
            {ENDPOINT_SLOTS.map((endpoint, index) => (
              <motion.div
                key={endpoint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`glass-panel-bright p-6 ${
                  endpoint.enabled ? 'border-l-4 border-l-control-success' : 'border-l-4 border-l-control-text-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-control-text-primary">
                        {endpoint.label}
                      </h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        endpoint.enabled ? 'bg-control-success/20 text-control-success' : 'bg-control-text-muted/20 text-control-text-muted'
                      }`}>
                        {endpoint.enabled ? 'Configured' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-control-text-secondary mb-3">
                      {endpoint.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-control-text-muted uppercase tracking-tighter">Auth Type:</span>{' '}
                        <Tooltip content="The authentication protocol used to talk to this model provider.">
                          <span className="font-mono text-control-text-primary">{endpoint.authType}</span>
                        </Tooltip>
                      </div>
                      <div>
                        <span className="text-control-text-muted uppercase tracking-tighter">Base URL:</span>{' '}
                        <Tooltip content="The entry point for this API. This is where PulZ sends its requests.">
                          <span className="font-mono text-control-text-primary text-[10px]">{endpoint.baseUrl}</span>
                        </Tooltip>
                      </div>
                      {endpoint.rateLimit && (
                        <>
                          <div>
                            <span className="text-control-text-muted uppercase tracking-tighter">Rate Limit:</span>{' '}
                            <span className="text-control-text-primary">{endpoint.rateLimit.requestsPerMinute}/min</span>
                          </div>
                          <div>
                            <span className="text-control-text-muted uppercase tracking-tighter">Burst Limit:</span>{' '}
                            <span className="text-control-text-primary">{endpoint.rateLimit.burstLimit}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => openExplain(endpoint)}
                      className="p-1.5 hover:bg-control-accent/10 rounded transition-colors text-control-text-secondary hover:text-control-accent"
                      title="Explain this endpoint"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {endpoint.requiresSecret && (
                      <div className="text-[10px] text-control-warning font-bold uppercase tracking-wider">
                        Requires Secret
                      </div>
                    )}
                    {endpoint.enabled && (
                      <div className="w-3 h-3 rounded-full bg-control-success animate-pulse" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="p-6 bg-control-warning/10 border border-control-warning/30 rounded-lg mb-12"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-control-warning mb-2">
                Security Notice
              </h3>
              <p className="text-xs text-control-text-secondary leading-relaxed">
                This configuration page displays metadata only. No API keys, tokens, or secrets are
                stored in this file. All credentials are managed securely through environment variables
                or secret management systems (GitHub Secrets, Netlify Environment Variables, etc.).
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <ExplainPanel 
        isOpen={isExplainOpen} 
        onClose={() => setIsExplainOpen(false)} 
        type="EndpointSlot" 
        data={selectedEndpoint}
      />
    </div>
  )
}
