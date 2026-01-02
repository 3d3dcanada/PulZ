/**
 * Operator Keyring - Single Source of Access Truth
 *
 * This is the canonical access state for the entire PulZ system.
 * All components must check this keyring before allowing access.
 *
 * SECURITY HONESTY:
 * This is client-side only. It is not real security.
 * This is an operator acknowledgment boundary, not authentication.
 *
 * The keyring represents:
 * "Has this operator acknowledged entry into the PulZ system?"
 */

export interface OperatorState {
  /**
   * Whether the operator has acknowledged entry
   */
  acknowledged: boolean

  /**
   * Timestamp when acknowledgment was granted (ISO string)
   */
  acknowledgedAt: string | null

  /**
   * Timestamp when acknowledgment expires (ISO string)
   */
  expiresAt: string | null

  /**
   * Unique session ID for this acknowledgment
   */
  sessionId: string | null
}

export interface KeyringConfig {
  /**
   * Default session duration in milliseconds (8 hours)
   */
  DEFAULT_SESSION_MS: number

  /**
   * Maximum session duration when "remember" is checked (7 days)
   */
  MAX_SESSION_MS: number

  /**
   * Storage key for session state (sessionStorage)
   */
  SESSION_KEY: string

  /**
   * Storage key for persistent state (localStorage)
   */
  PERSIST_KEY: string
}

const KEYRING_CONFIG: KeyringConfig = {
  DEFAULT_SESSION_MS: 8 * 60 * 60 * 1000, // 8 hours
  MAX_SESSION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_KEY: 'pulz_keyring_session',
  PERSIST_KEY: 'pulz_keyring_remember',
} as const

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get the human-readable operator state
 */
export function getOperatorState(): OperatorState {
  // Check if we're in the browser (not during SSR)
  if (typeof window === 'undefined') {
    return {
      acknowledged: false,
      acknowledgedAt: null,
      expiresAt: null,
      sessionId: null,
    }
  }

  // Check persistent storage first
  const persistData = localStorage.getItem(KEYRING_CONFIG.PERSIST_KEY)
  if (persistData) {
    try {
      const state = JSON.parse(persistData) as OperatorState
      if (state.acknowledged && state.expiresAt) {
        const now = Date.now()
        const expires = new Date(state.expiresAt).getTime()
        if (now < expires) {
          return state
        }
        // Expired, clear it
        clearKeyring()
      }
    } catch {
      // Invalid data, clear it
      clearKeyring()
    }
  }

  // Check session storage
  const sessionData = sessionStorage.getItem(KEYRING_CONFIG.SESSION_KEY)
  if (sessionData) {
    try {
      const state = JSON.parse(sessionData) as OperatorState
      if (state.acknowledged && state.expiresAt) {
        const now = Date.now()
        const expires = new Date(state.expiresAt).getTime()
        if (now < expires) {
          return state
        }
        // Expired, clear it
        clearKeyring()
      }
    } catch {
      // Invalid data, clear it
      clearKeyring()
    }
  }

  // No valid acknowledgment found
  return {
    acknowledged: false,
    acknowledgedAt: null,
    expiresAt: null,
    sessionId: null,
  }
}

/**
 * Check if operator has valid access
 */
export function checkAccess(): boolean {
  const state = getOperatorState()
  return state.acknowledged && state.expiresAt ? new Date(state.expiresAt) > new Date() : false
}

/**
 * Grant access to operator (acknowledgment)
 */
export function grantAccess(remember: boolean = false): OperatorState {
  const now = new Date()
  const duration = remember ? KEYRING_CONFIG.MAX_SESSION_MS : KEYRING_CONFIG.DEFAULT_SESSION_MS
  const expiresAt = new Date(now.getTime() + duration)

  const state: OperatorState = {
    acknowledged: true,
    acknowledgedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    sessionId: generateSessionId(),
  }

  // Store in appropriate location (browser only)
  if (typeof window !== 'undefined') {
    const storage = remember ? localStorage : sessionStorage
    const key = remember ? KEYRING_CONFIG.PERSIST_KEY : KEYRING_CONFIG.SESSION_KEY

    storage.setItem(key, JSON.stringify(state))
  }

  return state
}

/**
 * Revoke access (clear acknowledgment)
 */
export function revokeAccess(): void {
  clearKeyring()
}

/**
 * Clear all keyring data
 */
export function clearKeyring(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEYRING_CONFIG.PERSIST_KEY)
    sessionStorage.removeItem(KEYRING_CONFIG.SESSION_KEY)
  }
}

/**
 * Get time remaining until expiration (in minutes)
 */
export function getTimeRemaining(): number {
  const state = getOperatorState()
  if (!state.expiresAt || !state.acknowledged) {
    return 0
  }

  const now = Date.now()
  const expires = new Date(state.expiresAt).getTime()
  const remaining = Math.max(0, expires - now)

  return Math.floor(remaining / (60 * 1000))
}

/**
 * Get human-readable session info
 */
export function getSessionInfo(): {
  acknowledged: boolean
  acknowledgedAt: string | null
  expiresAt: string | null
  sessionId: string | null
  timeRemaining: number
  isRemembered: boolean
} {
  const state = getOperatorState()
  const timeRemaining = getTimeRemaining()
  const isRemembered = typeof window !== 'undefined' && localStorage.getItem(KEYRING_CONFIG.PERSIST_KEY) !== null

  return {
    acknowledged: state.acknowledged,
    acknowledgedAt: state.acknowledgedAt,
    expiresAt: state.expiresAt,
    sessionId: state.sessionId,
    timeRemaining,
    isRemembered,
  }
}
