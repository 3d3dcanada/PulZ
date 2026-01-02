'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Lobby from './Lobby'
import { checkAccess, getSessionInfo, clearKeyring } from '@/config/keyring'
import { ACCESS_CONFIG } from '@/config/access'

export default function OperatorBoundary({ children }: { children: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionInfo, setSessionInfo] = useState(getSessionInfo())
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check if access mode is disabled
    if (ACCESS_CONFIG.ACCESS_MODE === 'disabled') {
      setHasAccess(true)
      setIsLoading(false)
      return
    }

    // Check keyring access
    const authorized = checkAccess()

    if (authorized) {
      setHasAccess(true)
      setSessionInfo(getSessionInfo())

      // If at root, redirect to entry
      if (pathname === '/') {
        router.push('/entry')
      }
    } else {
      setHasAccess(false)
    }

    setIsLoading(false)
  }, [pathname, router])

  const handleEnterSystem = () => {
    setHasAccess(true)
    setSessionInfo(getSessionInfo())

    // Redirect to entry if at root
    if (pathname === '/') {
      router.push('/entry')
    }
  }

  const handleExit = () => {
    clearKeyring()
    setHasAccess(false)
    setSessionInfo(getSessionInfo())
    router.push('/')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-control-bg flex items-center justify-center">
        <div className="text-control-accent animate-pulse text-sm font-bold uppercase tracking-wider">
          Initializing...
        </div>
      </div>
    )
  }

  // Show lobby if no access
  if (!hasAccess) {
    return <Lobby onEnter={handleEnterSystem} />
  }

  // Render the system with children
  return (
    <>
      {children}
      {/* Session info for debugging (only visible in development or with specific flag) */}
      {process.env.NODE_ENV === 'development' && sessionInfo.acknowledged && (
        <div className="fixed bottom-4 right-4 z-50 text-[10px] text-control-text-muted bg-control-bg/90 border border-control-border/30 px-3 py-2 rounded">
          <div>Session: {sessionInfo.sessionId?.slice(0, 8)}...</div>
          <div>Expires: {sessionInfo.expiresAt ? new Date(sessionInfo.expiresAt).toLocaleTimeString() : 'N/A'}</div>
          <div>Remembered: {sessionInfo.isRemembered ? 'Yes' : 'No'}</div>
          <button
            onClick={handleExit}
            className="mt-1 text-control-warning hover:text-control-error underline"
          >
            Exit
          </button>
        </div>
      )}
    </>
  )
}
