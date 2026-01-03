import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import OperatorBoundary from '@/components/OperatorBoundary'

export const metadata: Metadata = {
  title: 'PulZ Control Room - AI Orchestration OS',
  description: 'Governance-first AI orchestration system with anti-hallucination guarantees, multi-model consensus, and human-centered control.',
  keywords: 'AI orchestration, governance, anti-hallucination, multi-model AI, consensus, validation',
  authors: [{ name: '3D3D.ca' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-control-bg text-control-text-primary antialiased selection:bg-control-accent/30">
        <OperatorBoundary>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </OperatorBoundary>
      </body>
    </html>
  )
}
