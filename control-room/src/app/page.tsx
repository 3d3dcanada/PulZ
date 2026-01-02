'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // The OperatorBoundary handles all authorization logic
    // This page just redirects to entry once authorized
    router.push('/entry')
  }, [router])

  // Loading state while OperatorBoundary handles authorization
  return (
    <div className="min-h-screen bg-control-bg flex items-center justify-center">
      <div className="text-control-accent animate-pulse text-sm font-bold uppercase tracking-wider">
        Loading...
      </div>
    </div>
  )
}
