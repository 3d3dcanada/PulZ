'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AccessGate from '@/components/AccessGate'
import { ACCESS_CONFIG, getAccessToken } from '@/config/access'

export default function Home() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let authorized = false

    if (ACCESS_CONFIG.ACCESS_MODE === 'disabled') {
      authorized = true
    } else {
      const token = getAccessToken()
      authorized = !!token
    }

    setIsAuthorized(authorized)
    setIsLoading(false)

    if (authorized) {
      router.push('/entry')
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-control-bg flex items-center justify-center">
        <div className="text-control-accent animate-pulse text-sm font-bold uppercase tracking-wider">
          Loading...
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return <AccessGate onAuthorized={() => setIsAuthorized(true)} />
  }

  return null
}
