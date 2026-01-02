'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  verifyPasscode,
  generateAccessToken,
  storeAccessToken,
  clearAccessToken,
  ACCESS_CONFIG,
} from '@/config/access'

interface AccessGateProps {
  onAuthorized: () => void
}

export default function AccessGate({ onAuthorized }: AccessGateProps) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [bootProgress, setBootProgress] = useState(0)

  // Simulate boot sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  // Check cooldown
  useEffect(() => {
    if (cooldownUntil) {
      const checkCooldown = setInterval(() => {
        if (Date.now() > cooldownUntil) {
          setCooldownUntil(null)
          setAttempts(0)
          clearInterval(checkCooldown)
        }
      }, 1000)

      return () => clearInterval(checkCooldown)
    }
  }, [cooldownUntil])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cooldownUntil) {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000)
      setError(`Too many attempts. Wait ${remaining}s before trying again.`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const isValid = await verifyPasscode(passcode)
      
      if (isValid) {
        const token = generateAccessToken(rememberMe)
        storeAccessToken(token, rememberMe)
        onAuthorized()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        if (newAttempts >= ACCESS_CONFIG.MAX_ATTEMPTS) {
          setCooldownUntil(Date.now() + ACCESS_CONFIG.COOLDOWN_MS)
          setError(`Too many incorrect attempts. Please wait 1 minute before trying again.`)
        } else {
          setError(`Incorrect passcode. ${ACCESS_CONFIG.MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        }
        setPasscode('')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    clearAccessToken()
    window.location.reload()
  }

  const getCooldownRemaining = () => {
    if (!cooldownUntil) return 0
    return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
  }

  return (
    <div className="min-h-screen bg-control-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-control-accent/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gate-consensus/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="glass-panel-bright p-8"
        >
          {/* Boot progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-control-accent">
                System Boot
              </span>
              <span className="text-[10px] font-mono text-control-text-muted">
                {Math.round(bootProgress)}%
              </span>
            </div>
            <div className="h-1 bg-control-border/50 overflow-hidden">
              <motion.div
                className="h-full bg-control-accent"
                initial={{ width: 0 }}
                animate={{ width: `${bootProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold mb-4 tracking-tighter">
              <span className="text-gradient">PulZ</span>
            </h1>
            <p className="text-control-text-secondary text-sm">
              Orchestration OS &mdash; Access Control
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label htmlFor="passcode" className="block text-xs font-bold uppercase tracking-wider text-control-text-secondary mb-2">
                Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={isLoading || !!cooldownUntil}
                placeholder="Enter access passcode"
                className="w-full px-4 py-3 bg-control-bg/50 border border-control-border/70 rounded-lg text-control-text-primary placeholder-control-text-muted/50 focus:outline-none focus:border-control-accent/70 focus:ring-1 focus:ring-control-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-control-border bg-control-bg/50 text-control-accent focus:ring-control-accent/30"
              />
              <label htmlFor="remember" className="text-sm text-control-text-secondary cursor-pointer">
                Remember access for 7 days
              </label>
            </div>

            {/* Error state */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-control-error/10 border border-control-error/30 rounded-lg p-4"
                >
                  <p className="text-sm text-control-error">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !!cooldownUntil || !passcode.trim()}
              className="w-full px-6 py-4 bg-control-accent/20 border border-control-accent/50 text-control-accent rounded-lg font-bold uppercase tracking-wider hover:bg-control-accent/30 hover:border-control-accent/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-control-accent/20 disabled:hover:border-control-accent/50"
            >
              {isLoading ? 'Verifying...' : 'Enter Control Room'}
            </button>
          </motion.form>

          {/* Request access */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-6 border-t border-control-border/50 text-center"
          >
            <p className="text-xs text-control-text-muted mb-3">
              Don&apos;t have a passcode?
            </p>
            <a
              href="mailto:access@3d3d.ca?subject=PulZ%20Access%20Request"
              className="text-sm text-control-accent hover:text-control-accent/80 transition-colors"
            >
              Request Access
            </a>
          </motion.div>

          {/* Security honesty toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="text-[10px] text-control-text-muted hover:text-control-text-secondary transition-colors"
            >
              {showInfo ? 'Hide' : 'Show'} security information
            </button>

            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-control-border/20 rounded-lg text-left"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-control-accent mb-2">
                    Demo Access Gate (client-side)
                  </h4>
                  <p className="text-[10px] text-control-text-secondary leading-relaxed mb-2">
                    This access control is implemented on the client side for demonstration purposes. It is not true security and can be bypassed by knowledgeable users.
                  </p>
                  <p className="text-[10px] text-control-text-secondary leading-relaxed">
                    For production deployment, this should be upgraded to server-side authentication (Netlify Functions, Supabase Auth, or Cloudflare Access). See the upgrade path documentation for details.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-[10px] text-control-text-muted uppercase tracking-wider">
            3D3D.ca &bull; Governance-First Design
          </p>
        </motion.div>
      </div>
    </div>
  )
}
