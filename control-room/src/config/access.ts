/**
 * Access Boundary Configuration
 *
 * SECURITY HONESTY REQUIREMENT:
 * This project currently implements an operator acknowledgment boundary (client-side).
 * It is NOT authentication and it does NOT protect sensitive data.
 *
 * Real identity, roles, recovery, and audit should be implemented server-side
 * (next phase: Supabase Identity Boundary).
 */

export type AccessMode = 'operator_boundary' | 'disabled'

export const ACCESS_CONFIG = {
  /**
   * Access mode:
   * - operator_boundary: Requires a human acknowledgment click before rendering the system
   * - disabled: No access restriction (useful for local dev or fully public demos)
   */
  ACCESS_MODE: 'operator_boundary' as AccessMode,
} as const
