export type PulzUser = {
  id: string
  display_name: string
  role: string
}

function isPulzUser(value: unknown): value is PulzUser {
  if (!value || typeof value !== 'object') {
    return false
  }
  const record = value as Partial<PulzUser>
  return (
    typeof record.id === 'string' &&
    typeof record.display_name === 'string' &&
    typeof record.role === 'string'
  )
}

export function getPulzUser(): PulzUser | null {
  if (typeof window === 'undefined') {
    return null
  }
  const candidate = (window as Window & { __PULZ_USER__?: unknown }).__PULZ_USER__
  if (isPulzUser(candidate)) {
    return candidate
  }
  return null
}

export function getPulzUserId(): string {
  return getPulzUser()?.id ?? 'local-operator'
}
