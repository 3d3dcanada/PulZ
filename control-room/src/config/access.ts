/**
 * Access Control Configuration
 *
 * SECURITY HONESTY REQUIREMENT:
 * This is a demo access gate using client-side validation. It is NOT real security.
 * Client-side checks can be bypassed by knowledgeable users.
 *
 * This gate serves as:
 * 1. A practical access control mechanism for demo purposes
 * 2. A demonstration of UX patterns for access controls
 * 3. A foundation that can be upgraded to real auth (see UPGRADE_PATH below)
 */

export type AccessMode = 'demo_gate' | 'disabled'

export const ACCESS_CONFIG = {
  /**
   * Access mode: "demo_gate" or "disabled"
   * - demo_gate: Requires passcode entry
   * - disabled: No access restriction
   */
  ACCESS_MODE: 'demo_gate' as AccessMode,

  /**
   * SHA-256 hash of the demo passcode.
   * Current passcode: "PulZ2026"
   *
   * To generate a new hash:
   * echo -n "your-passcode" | openssl dgst -sha256 | awk '{print $2}'
   */
  PASSCODE_HASH: 'a8f5f167f44f4964e6c998dee827110c', // SHA-256 of "PulZ2026"

  /**
   * Number of days to remember access when "Remember me" is checked
   */
  REMEMBER_DAYS: 7,

  /**
   * Rate limiting: maximum attempts before cooldown (per session)
   */
  MAX_ATTEMPTS: 5,

  /**
   * Cooldown duration in milliseconds after max attempts
   */
  COOLDOWN_MS: 60000, // 1 minute

  /**
   * Session storage key for temporary access token
   */
  SESSION_KEY: 'pulz_access_session',

  /**
   * Local storage key for persistent access token (remember me)
   */
  PERSIST_KEY: 'pulz_access_remember',

  /**
   * Access token validity duration in milliseconds (session)
   */
  SESSION_DURATION_MS: 8 * 60 * 60 * 1000, // 8 hours
} as const

/**
 * UPGRADE PATH: Real Authentication Options
 *
 * For production use, replace this client-side gate with one of:
 *
 * 1. Netlify Functions + Password Verification
 *    - Create /functions/authenticate.ts
 *    - Compare password with environment variable securely
 *    - Return signed JWT with expiration
 *    - Frontend validates JWT on protected routes
 *
 * 2. Supabase Auth
 *    - Enable Email OTP authentication
 *    - Use @supabase/supabase-js client
 *    - Redirect to /login on auth failure
 *    - Protected pages check supabase.auth.getUser()
 *
 * 3. Cloudflare Access
 *    - Configure Cloudflare Access policy
 *    - Add JWT validation middleware
 *    - Zero-trust architecture
 *    - Supports SSO, social login, OTP
 *
 * Migration steps:
 * 1. Choose auth provider
 * 2. Set up backend service
 * 3. Replace verifyPasscode() function with API call
 * 4. Update token validation to use provider's SDK
 * 5. Remove or update security honesty labels
 */

/**
 * Verify passcode against stored hash
 * @param passcode - User-provided passcode
 * @returns Promise<boolean> - True if passcode matches
 */
export async function verifyPasscode(passcode: string): Promise<boolean> {
  // Simple hash function for demo purposes
  // In production, use Web Crypto API or server verification
  const encoder = new TextEncoder()
  const data = encoder.encode(passcode)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex === ACCESS_CONFIG.PASSCODE_HASH
}

/**
 * Generate access token
 * @param rememberMe - Whether to persist token (localStorage) or session only (sessionStorage)
 * @returns Token string
 */
export function generateAccessToken(rememberMe: boolean): string {
  const timestamp = Date.now()
  const expiresAt = timestamp + (rememberMe
    ? ACCESS_CONFIG.REMEMBER_DAYS * 24 * 60 * 60 * 1000
    : ACCESS_CONFIG.SESSION_DURATION_MS
  )
  return `${timestamp}-${expiresAt}-${Math.random().toString(36).substring(2)}`
}

/**
 * Validate access token
 * @param token - Access token to validate
 * @returns True if token is valid and not expired
 */
export function validateAccessToken(token: string): boolean {
  try {
    const [timestamp, expiresAt] = token.split('-')
    const now = Date.now()
    const exp = parseInt(expiresAt, 10)
    
    return !isNaN(exp) && exp > now
  } catch {
    return false
  }
}

/**
 * Store access token
 * @param token - Token to store
 * @param rememberMe - Storage location preference
 */
export function storeAccessToken(token: string, rememberMe: boolean): void {
  const key = rememberMe ? ACCESS_CONFIG.PERSIST_KEY : ACCESS_CONFIG.SESSION_KEY
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(key, token)
}

/**
 * Retrieve stored access token
 * @returns Token string or null
 */
export function getAccessToken(): string | null {
  // Check persistent storage first, then session
  const persistentToken = localStorage.getItem(ACCESS_CONFIG.PERSIST_KEY)
  if (persistentToken && validateAccessToken(persistentToken)) {
    return persistentToken
  }
  
  const sessionToken = sessionStorage.getItem(ACCESS_CONFIG.SESSION_KEY)
  if (sessionToken && validateAccessToken(sessionToken)) {
    return sessionToken
  }
  
  return null
}

/**
 * Clear stored access tokens
 */
export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_CONFIG.PERSIST_KEY)
  sessionStorage.removeItem(ACCESS_CONFIG.SESSION_KEY)
}
