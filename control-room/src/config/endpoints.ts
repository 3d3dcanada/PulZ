/**
 * External API Endpoint Configuration
 *
 * PulZ supports up to 10 external API endpoints for integration.
 * Each endpoint is pre-configured with metadata but contains no secrets.
 *
 * Security:
 * - No API keys or secrets are committed to this file
 * - Auth credentials are stored securely (environment variables, secret management)
 * - This file only contains structural configuration
 */

export interface EndpointConfig {
  id: string
  label: string
  description: string
  baseUrl: string
  authType: 'none' | 'header' | 'query' | 'bearer' | 'oauth'
  enabled: boolean
  rateLimit?: {
    requestsPerMinute: number
    burstLimit: number
  }
  requiresSecret: boolean
}

/**
 * Endpoint slots (max 10)
 *
 * Slots 1-3: Core AI Services
 * Slots 4-6: Business Operations
 * Slots 7-8: Monitoring & Observability
 * Slots 9-10: Future Extensions
 */
export const ENDPOINT_SLOTS: EndpointConfig[] = [
  // ===== CORE AI SERVICES (Slots 1-3) =====
  {
    id: 'anthropic-claude',
    label: 'Anthropic Claude',
    description: 'Primary reasoning and analysis model for governance decisions',
    baseUrl: 'https://api.anthropic.com',
    authType: 'header',
    enabled: true,
    rateLimit: {
      requestsPerMinute: 60,
      burstLimit: 100,
    },
    requiresSecret: true,
  },
  {
    id: 'openai-gpt',
    label: 'OpenAI GPT-4',
    description: 'Secondary reasoning model for consensus validation',
    baseUrl: 'https://api.openai.com',
    authType: 'bearer',
    enabled: true,
    rateLimit: {
      requestsPerMinute: 500,
      burstLimit: 1000,
    },
    requiresSecret: true,
  },
  {
    id: 'google-gemini',
    label: 'Google Gemini',
    description: 'Tertiary reasoning model for diverse perspective validation',
    baseUrl: 'https://generativelanguage.googleapis.com',
    authType: 'query',
    enabled: false,
    rateLimit: {
      requestsPerMinute: 60,
      burstLimit: 100,
    },
    requiresSecret: true,
  },

  // ===== BUSINESS OPERATIONS (Slots 4-6) =====
  {
    id: 'email-ingest',
    label: 'Email Ingestion',
    description: 'IMAP/POP3 connector for extracting business emails',
    baseUrl: 'https://api.email-service.example.com',
    authType: 'bearer',
    enabled: false,
    requiresSecret: true,
  },
  {
    id: 'tender-feeds',
    label: 'Tender Feeds',
    description: 'API connector for government procurement tender feeds',
    baseUrl: 'https://api.tenders.example.com',
    authType: 'header',
    enabled: false,
    requiresSecret: true,
  },
  {
    id: 'quote-forms',
    label: 'Quote Forms',
    description: 'Webhook receiver for customer quote submissions',
    baseUrl: 'https://api.quotes.example.com',
    authType: 'bearer',
    enabled: false,
    requiresSecret: true,
  },

  // ===== MONITORING & OBSERVABILITY (Slots 7-8) =====
  {
    id: 'error-tracking',
    label: 'Error Tracking',
    description: 'Sentry/LogRocket integration for error monitoring',
    baseUrl: 'https://sentry.io',
    authType: 'header',
    enabled: false,
    requiresSecret: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Google Analytics / Plausible integration for usage metrics',
    baseUrl: 'https://analytics.example.com',
    authType: 'none',
    enabled: false,
    requiresSecret: false,
  },

  // ===== FUTURE EXTENSIONS (Slots 9-10) =====
  {
    id: 'nvidia-nemotron',
    label: 'NVIDIA Nemotron',
    description: 'Reserved for future NVIDIA model integration',
    baseUrl: 'https://integrate.api.nvidia.com',
    authType: 'bearer',
    enabled: false,
    requiresSecret: true,
  },
  {
    id: 'groq-inference',
    label: 'Groq Inference',
    description: 'Reserved for future Groq ultra-fast inference',
    baseUrl: 'https://api.groq.com',
    authType: 'bearer',
    enabled: false,
    requiresSecret: true,
  },
]

/**
 * Get enabled endpoints only
 */
export function getEnabledEndpoints(): EndpointConfig[] {
  return ENDPOINT_SLOTS.filter(ep => ep.enabled)
}

/**
 * Get endpoint by ID
 */
export function getEndpointById(id: string): EndpointConfig | undefined {
  return ENDPOINT_SLOTS.find(ep => ep.id === id)
}

/**
 * Count endpoints by status
 */
export function getEndpointStats() {
  return {
    total: ENDPOINT_SLOTS.length,
    enabled: ENDPOINT_SLOTS.filter(ep => ep.enabled).length,
    disabled: ENDPOINT_SLOTS.filter(ep => !ep.enabled).length,
    requiresSecret: ENDPOINT_SLOTS.filter(ep => ep.requiresSecret).length,
  }
}
