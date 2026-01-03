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

    // Add operator boundary bypass incident
    INCIDENT_LOG.push({
      incident: {
        id: 'INC-2025-002',
        timestamp: '2025-01-03T00:00:00Z',
        description: 'Operator boundary bypass via direct navigation',
        deploymentMode: 'custom_domain',
        probableCauses: [
          'Access gate implemented only on root page (/)',
          'Navigation links accessible without authorization',
          'Direct URLs could bypass the gate entirely',
          'No global boundary enforcement at layout level',
        ],
        status: 'resolved',
        checks: [
          {
            passed: false,
            message: 'Operator boundary not enforced globally',
            details: 'AccessGate component only rendered on page.tsx. Navigation and other pages were reachable directly.',
            timestamp: '2025-01-03T00:00:00Z',
          },
          {
            passed: false,
            message: 'Deep links bypass operator acknowledgment',
            details: 'Visiting /learning, /settings, or /entry directly showed full UI without passing through gate.',
            timestamp: '2025-01-03T00:00:00Z',
          },
          {
            passed: false,
            message: 'Navigation functional before authorization',
            details: 'Header navigation allowed full system traversal without acknowledgment.',
            timestamp: '2025-01-03T00:00:00Z',
          },
        ],
      },
      resolution: {
        rootCause: 'Access control was page-specific rather than system-wide. The boundary needed to exist at the highest architectural level (layout) to ensure nothing could render or be navigated to before operator acknowledgment.',
        preventionGate: 'Implemented global OperatorBoundary component at layout level. Created keyring.ts as single source of access truth. Lobby UI provides a clear, honest operator acknowledgment (no passwords) before any system UI renders. All navigation is blocked until acknowledgment is granted.',
        verifiedAt: '2025-01-03T00:30:00Z',
        verifiedBy: 'cto.new',
      },
      closedAt: '2025-01-03T00:30:00Z',
    })

    // Fake authentication illusion incident
    INCIDENT_LOG.push({
      incident: {
        id: 'INC-2026-001',
        timestamp: '2026-01-03T00:00:00Z',
        description: 'Fake authentication illusion in demo lobby UI',
        deploymentMode: 'custom_domain',
        probableCauses: [
          'Password-style UI added without backend authentication',
          'Email-style recovery link implied accounts and support workflow',
          'Rate limiting and lockout logic copied from real auth patterns',
        ],
        status: 'resolved',
        checks: [
          {
            passed: false,
            message: 'Lobby UI implies password authentication',
            details: 'Password input field and verification flow existed despite no server-side identity.',
            timestamp: '2026-01-03T00:00:00Z',
          },
          {
            passed: false,
            message: 'Email recovery implied without accounts',
            details: '"Request Access" mailto link suggested account-style access and recovery.',
            timestamp: '2026-01-03T00:00:00Z',
          },
          {
            passed: false,
            message: 'Rate limiting and lockout created operator friction',
            details: 'Attempt counters and cooldowns can lock out legitimate operators in a demo boundary.',
            timestamp: '2026-01-03T00:00:00Z',
          },
        ],
      },
      resolution: {
        rootCause: 'The lobby adopted password and recovery UX patterns without any real authentication backend, creating a false sense of security and potential operator lockout.',
        preventionGate: 'Removed all password, retry/lockout, and email recovery UI. Replaced with a single explicit acknowledgment checkbox and an "Enter PulZ System" action, with plain-language honesty messaging. Rule: authentication UI is only allowed once a real backend identity system exists (next phase: Supabase).',
        verifiedAt: '2026-01-03T00:15:00Z',
        verifiedBy: 'cto.new',
      },
      closedAt: '2026-01-03T00:15:00Z',
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
