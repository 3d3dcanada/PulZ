import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth/AuthContext'

export const metadata: Metadata = {
  title: 'PulZ Revenue System',
  description: 'Internal revenue operations for 3D printing and software services',
}

/**
 * PulZ-specific layout
 *
 * This layout is separate from the main Control Room layout.
 * It uses ONLY OpenWebUI authentication (not OperatorBoundary).
 *
 * PulZ pages render their own navigation and handle their own auth via AuthGuard.
 */
export default function PulZLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
