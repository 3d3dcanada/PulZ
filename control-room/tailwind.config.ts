import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        control: {
          bg: '#0a0e1a',
          surface: '#131824',
          border: '#1e293b',
          accent: '#3b82f6',
          accentDim: '#1e40af',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            muted: '#64748b',
          },
        },
        gate: {
          structural: '#3b82f6',
          evidence: '#8b5cf6',
          consistency: '#06b6d4',
          consensus: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'control': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
export default config
