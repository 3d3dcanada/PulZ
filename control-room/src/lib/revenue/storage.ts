import type {
  Draft,
  FulfillmentStep,
  Job,
  Opportunity,
  RevenueEvent,
} from './types'

export type MockStoreSnapshot = {
  opportunities: Opportunity[]
  drafts: Draft[]
  jobs: Job[]
  fulfillmentSteps: FulfillmentStep[]
  revenueEvents: RevenueEvent[]
  idCounter: number
}

const STORAGE_PREFIX = 'pulz'

const STORAGE_KEYS = {
  opportunities: 'opportunities',
  drafts: 'drafts',
  jobs: 'jobs',
  fulfillmentSteps: 'fulfillment_steps',
  revenueEvents: 'revenue_events',
  idCounter: 'id_counter',
} as const

function getNamespacedKey(userId: string, key: string): string {
  return `${STORAGE_PREFIX}:${userId}:${key}`
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadMockStoreSnapshot(userId: string): MockStoreSnapshot {
  if (typeof window === 'undefined') {
    return {
      opportunities: [],
      drafts: [],
      jobs: [],
      fulfillmentSteps: [],
      revenueEvents: [],
      idCounter: 0,
    }
  }

  return {
    opportunities: safeParse<Opportunity[]>(
      localStorage.getItem(getNamespacedKey(userId, STORAGE_KEYS.opportunities)),
      []
    ),
    drafts: safeParse<Draft[]>(
      localStorage.getItem(getNamespacedKey(userId, STORAGE_KEYS.drafts)),
      []
    ),
    jobs: safeParse<Job[]>(
      localStorage.getItem(getNamespacedKey(userId, STORAGE_KEYS.jobs)),
      []
    ),
    fulfillmentSteps: safeParse<FulfillmentStep[]>(
      localStorage.getItem(getNamespacedKey(userId, STORAGE_KEYS.fulfillmentSteps)),
      []
    ),
    revenueEvents: safeParse<RevenueEvent[]>(
      localStorage.getItem(getNamespacedKey(userId, STORAGE_KEYS.revenueEvents)),
      []
    ),
    idCounter: safeParse<number>(
      localStorage.getItem(getNamespacedKey(userId, STORAGE_KEYS.idCounter)),
      0
    ),
  }
}

export function persistMockStoreSnapshot(userId: string, snapshot: MockStoreSnapshot): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem(
    getNamespacedKey(userId, STORAGE_KEYS.opportunities),
    JSON.stringify(snapshot.opportunities)
  )
  localStorage.setItem(
    getNamespacedKey(userId, STORAGE_KEYS.drafts),
    JSON.stringify(snapshot.drafts)
  )
  localStorage.setItem(
    getNamespacedKey(userId, STORAGE_KEYS.jobs),
    JSON.stringify(snapshot.jobs)
  )
  localStorage.setItem(
    getNamespacedKey(userId, STORAGE_KEYS.fulfillmentSteps),
    JSON.stringify(snapshot.fulfillmentSteps)
  )
  localStorage.setItem(
    getNamespacedKey(userId, STORAGE_KEYS.revenueEvents),
    JSON.stringify(snapshot.revenueEvents)
  )
  localStorage.setItem(
    getNamespacedKey(userId, STORAGE_KEYS.idCounter),
    JSON.stringify(snapshot.idCounter)
  )
}

export function clearMockStoreSnapshot(userId: string): void {
  if (typeof window === 'undefined') {
    return
  }
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(getNamespacedKey(userId, key))
  })
}
