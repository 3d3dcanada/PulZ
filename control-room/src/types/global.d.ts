import type { PulzUser } from '@/lib/pulz/user'

declare global {
  interface Window {
    __PULZ_USER__?: PulzUser
  }
}

export {}
