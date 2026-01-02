/**
 * Append-Only Incident Log
 *
 * Learning library for deployment incidents.
 * Records what failed, how it was detected, and how recurrence is prevented.
 *
 * Lightweight implementation:
 * - No heavy token usage
 * - No complex tooling
 * - Simple JSONL format for easy parsing
 */

import type { Incident, IncidentResolution } from './verificationChecklist'

export interface IncidentEntry {
  incident: Incident
  resolution?: IncidentResolution
  closedAt?: string
}

/**
 * Incident Log (in-memory for demo)
 * 
 * In production, this would append to:
 * - JSONL file (build-time only)
 * - Database (runtime)
 * - External logging service
 */
let INCIDENT_LOG: IncidentEntry[] = []

/**
 * Seed with the deployment incident that prompted this system
 */
export function seedIncidentLog(): void {
  if (INCIDENT_LOG.length === 0) {
    INCIDENT_LOG.push({
      incident: {
        id: 'INC-2025-001',
        timestamp: '2025-01-02T19:00:00Z',
        description: 'GitHub Pages displayed 404 error despite successful workflow deployment',
        deploymentMode: 'custom_domain',
        probableCauses: [
          'Base path configuration mismatch with deployment mode',
          'Workflow hardcoded /PulZ base path while CNAME exists for custom domain',
          'Assets referenced with /PulZ/ prefix while serving from domain root',
        ],
        status: 'resolved',
        checks: [
          {
            passed: false,
            message: 'Base path configuration does not match deployment mode',
            details: 'Workflow: NEXT_PUBLIC_BASE_PATH=/PulZ, CNAME: ktk3d.com (custom domain)',
            timestamp: '2025-01-02T19:00:00Z',
          },
          {
            passed: false,
            message: 'Asset references broken due to base path mismatch',
            details: 'JS/CSS files have /PulZ/ prefix, serving from /',
            timestamp: '2025-01-02T19:00:00Z',
          },
        ],
      },
      resolution: {
        rootCause: 'Configuration mismatch between deployment mode and base path: Workflow hardcoded NEXT_PUBLIC_BASE_PATH=/PulZ while repository contains CNAME file for custom domain deployment. With /PulZ base path, all assets receive /PulZ/ prefix but GitHub Pages serves from domain root (/).',
        preventionGate: 'Updated workflow to detect deployment mode from CNAME presence and set NEXT_PUBLIC_BASE_PATH conditionally. Added build assertion step to verify index.html and 404.html exist in export output.',
        verifiedAt: '2025-01-02T19:30:00Z',
        verifiedBy: 'cto.new',
      },
      closedAt: '2025-01-02T19:30:00Z',
    })
  }
}

/**
 * Append incident to log
 * @param incident - Incident to log
 */
export function appendIncident(incident: Incident): void {
  const entry: IncidentEntry = { incident }
  INCIDENT_LOG.push(entry)
  
  // In production, write to JSONL file:
  // fs.appendFileSync('incidents.jsonl', JSON.stringify(entry) + '\n')
}

/**
 * Resolve incident with root cause and prevention gate
 * @param incidentId - ID of incident to resolve
 * @param resolution - Resolution details
 */
export function resolveIncident(incidentId: string, resolution: IncidentResolution): void {
  const entry = INCIDENT_LOG.find(e => e.incident.id === incidentId)
  if (entry) {
    entry.resolution = resolution
    entry.incident.status = 'resolved'
    entry.closedAt = new Date().toISOString()
  }
}

/**
 * Get all incidents
 */
export function getAllIncidents(): IncidentEntry[] {
  return [...INCIDENT_LOG]
}

/**
 * Get open incidents
 */
export function getOpenIncidents(): IncidentEntry[] {
  return INCIDENT_LOG.filter(e => e.incident.status !== 'resolved')
}

/**
 * Get incident by ID
 */
export function getIncidentById(id: string): IncidentEntry | undefined {
  return INCIDENT_LOG.find(e => e.incident.id === id)
}

/**
 * Get incident statistics
 */
export function getIncidentStats() {
  return {
    total: INCIDENT_LOG.length,
    open: INCIDENT_LOG.filter(e => e.incident.status === 'open').length,
    investigating: INCIDENT_LOG.filter(e => e.incident.status === 'investigating').length,
    resolved: INCIDENT_LOG.filter(e => e.incident.status === 'resolved').length,
    meanTimeToResolve: calculateMeanTimeToResolve(),
  }
}

/**
 * Calculate mean time to resolve incidents (in hours)
 */
function calculateMeanTimeToResolve(): number {
  const resolved = INCIDENT_LOG.filter(e => e.closedAt && e.incident.timestamp)
  
  if (resolved.length === 0) return 0
  
  const totalTime = resolved.reduce((sum, e) => {
    const start = new Date(e.incident.timestamp).getTime()
    const end = new Date(e.closedAt!).getTime()
    return sum + (end - start)
  }, 0)
  
  return (totalTime / resolved.length) / (1000 * 60 * 60) // Convert ms to hours
}

/**
 * Export log as JSONL (for build-time logging)
 */
export function exportAsJSONL(): string {
  return INCIDENT_LOG.map(entry => JSON.stringify(entry)).join('\n')
}

/**
 * Import log from JSONL (for build-time logging)
 */
export function importFromJSONL(jsonl: string): void {
  const lines = jsonl.trim().split('\n')
  const entries = lines.map(line => JSON.parse(line) as IncidentEntry)
  INCIDENT_LOG = entries
}
