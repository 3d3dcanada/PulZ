import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PulZ Control Room - AI Orchestration OS',
  description: 'Governance-first AI orchestration system with anti-hallucination guarantees, multi-model consensus, and human-centered control.',
  keywords: 'AI orchestration, governance, anti-hallucination, multi-model AI, consensus, validation',
  authors: [{ name: '3D3D.ca' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0a0e1a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
