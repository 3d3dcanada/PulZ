'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { AuditEvent, globalAuditLog } from '../../kernel'
import Tooltip from './literacy/Tooltip'
import ExplainPanel from './literacy/ExplainPanel'
import { Info } from 'lucide-react'

export default function AuditViewer() {
  const [events, setEvents] = useState<readonly AuditEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)
  const [isChainValid, setIsChainValid] = useState(true)
  const [isExplainOpen, setIsExplainOpen] = useState(false)

  useEffect(() => {
    const loadEvents = () => {
      setEvents(globalAuditLog.getEvents())
      setIsChainValid(globalAuditLog.verifyChain())
    }
    
    loadEvents()
    const interval = setInterval(loadEvents, 1000)
    return () => clearInterval(interval)
  }, [])

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('create')) return '+'
    if (eventType.includes('approve')) return '✓'
    if (eventType.includes('reject')) return '✗'
    if (eventType.includes('revoke')) return '⟲'
    return '•'
  }

  const getEventColor = (eventType: string) => {
    if (eventType.includes('create')) return 'text-control-accent'
    if (eventType.includes('approve')) return 'text-control-success'
    if (eventType.includes('reject')) return 'text-control-error'
    if (eventType.includes('revoke')) return 'text-control-warning'
    return 'text-control-text-muted'
  }

  return (
    <div className="glass-panel-bright p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Audit Trail</h3>
          <p className="text-sm text-control-text-muted">
            Append-only log • {events.length} events • 
            <span className={isChainValid ? 'text-control-success ml-2' : 'text-control-error ml-2'}>
              {isChainValid ? '✓ Chain valid' : '✗ Chain broken'}
            </span>
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-control-text-muted">
          <p className="mb-2">No audit events yet</p>
          <p className="text-xs">Events will appear here as actions are performed</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {[...events].reverse().map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="glass-panel p-4 hover:bg-control-surface/60 cursor-pointer transition-all"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex items-start space-x-4">
                <div className={`text-2xl ${getEventColor(event.event_type)}`}>
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-control-text-muted">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-control-text-muted">
                    <div>
                      <span className="text-control-text-secondary">Actor:</span> {event.actor.type}
                      {event.actor.id && ` (${event.actor.id})`}
                    </div>
                    <div>
                      <span className="text-control-text-secondary">Related:</span> {event.related.kind} {event.related.id}
                    </div>
                    <div className="font-mono text-[10px]">
                      <span className="text-control-text-secondary">Hash:</span>{' '}
                      <Tooltip content="Cryptographic fingerprint ensuring this record hasn't been tampered with.">
                        {event.after_hash.slice(0, 12)}...
                      </Tooltip>
                    </div>
                  </div>
                  {event.notes && (
                    <div className="mt-2 text-xs text-control-text-secondary italic">
                      {event.notes}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel-bright p-8 max-w-2xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-control-accent">Event Details</h3>
                <button
                  onClick={() => setIsExplainOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-control-accent/10 hover:bg-control-accent/20 rounded text-xs text-control-accent transition-colors"
                >
                  <Info className="w-3 h-3" />
                  Explain This
                </button>
              </div>
              <div className="space-y-4 font-mono text-sm">
                <div>
                  <div className="text-control-text-muted text-xs mb-1 uppercase tracking-widest">ID</div>
                  <div className="text-control-text-primary">{selectedEvent.id}</div>
                </div>
                <div>
                  <div className="text-control-text-muted text-xs mb-1">Event Type</div>
                  <div className="text-control-text-primary">{selectedEvent.event_type}</div>
                </div>
                <div>
                  <div className="text-control-text-muted text-xs mb-1">Timestamp</div>
                  <div className="text-control-text-primary">
                    {new Date(selectedEvent.timestamp).toISOString()}
                  </div>
                </div>
                <div>
                  <div className="text-control-text-muted text-xs mb-1">Actor</div>
                  <div className="text-control-text-primary">
                    {selectedEvent.actor.type} {selectedEvent.actor.id && `(${selectedEvent.actor.id})`}
                  </div>
                </div>
                <div>
                  <div className="text-control-text-muted text-xs mb-1">Related Entity</div>
                  <div className="text-control-text-primary">
                    {selectedEvent.related.kind}: {selectedEvent.related.id}
                  </div>
                </div>
                <div>
                  <div className="text-control-text-muted text-xs mb-1">Before Hash</div>
                  <div className="text-control-text-primary break-all">{selectedEvent.before_hash}</div>
                </div>
                <div>
                  <div className="text-control-text-muted text-xs mb-1">After Hash</div>
                  <div className="text-control-text-primary break-all">{selectedEvent.after_hash}</div>
                </div>
                {selectedEvent.notes && (
                  <div>
                    <div className="text-control-text-muted text-xs mb-1">Notes</div>
                    <div className="text-control-text-primary">{selectedEvent.notes}</div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="mt-6 w-full py-3 glass-panel hover:bg-control-surface/60 transition-all text-control-accent font-semibold"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExplainPanel 
        isOpen={isExplainOpen} 
        onClose={() => setIsExplainOpen(false)} 
        type="AuditEvent" 
        data={selectedEvent}
      />
    </div>
  )
}
