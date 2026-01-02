# PulZ Control Room - Technical Architecture

## Overview

This is a static Next.js site that demonstrates the PulZ AI Orchestration OS governance model through interactive components. No backend, no API calls, pure client-side JavaScript with React and Framer Motion.

## Governance Hardening

PulZ implements a "Trust, but Verify" architecture. The following hardening principles are baked into the core design:

### 1. Evidence-Gated Execution
Every action proposed by the system must be backed by a "Truth Model" criterion (Direct Observation, User-Confirmed Fact, Cited Source, or Consensus Inference). Without this grounding, the action state is locked.

### 2. Multi-Model Consensus
We do not trust a single LLM for critical business logic. Every output from a Primary Model is critiqued by at least two distinct models (e.g., Claude reviewed by GPT-4 and Gemini). If agreement falls below 70%, the system halts and escalates to human review.

### 3. Human Authority Invariants
The system is designed with a "No Silent Autonomy" rule. Irreversible actions, financial transactions, and low-confidence decisions are hard-gated. The UI reflects this by never implying that an action will happen without explicit human approval.

### 4. Deterministic Circuit Breakers
Beyond AI logic, the system enforces deterministic boundaries:
- **Budget Breakers**: Hard caps on API spend and token usage.
- **Loop Detection**: Stops recursive AI logic patterns.
- **Trace Auditability**: Every decision is stored with its full validation trace (all 4 gates).

## Build Safety & Invariants

The build system enforces explicit dependencies to prevent silent failures. This is not a tool limitation—it is a deliberate architectural invariant.

### Root Cause Pattern
Build failures can occur when components implicitly use dependencies without explicit imports. This happens because:
- A component references a JSX element (e.g., `<AnimatePresence>`)
- The dependency exists in the installed packages (e.g., framer-motion exports it)
- The import statement is missing from the file
- TypeScript allows usage before the build gate

### Dependency Invariant
**All animation primitives and React components must be explicitly imported at the component level.**

This means:
- `motion` must be imported: `import { motion } from 'framer-motion'`
- `AnimatePresence` must be imported: `import { AnimatePresence } from 'framer-motion'`
- Any JSX identifier must have a corresponding import
- No reliance on global or implicit imports

### Hardening Mechanism
ESLint rule `react/jsx-no-undef` is enabled and enforced at build time. This rule:
- Fails the build when JSX identifiers are used without import
- Catches missing dependencies before deployment
- Prevents silent runtime errors

The build gate correctly stopped deployment when AnimatePresence was used without import in Step 2. This is the system working as designed.

## Technology Stack

### Core Framework
- **Next.js 14.2.35**: App Router with static export
- **React 18.3.1**: Functional components with hooks
- **TypeScript 5.9.3**: Strict mode enabled

### Styling
- **Tailwind CSS 3.4.19**: Utility-first CSS framework
- **PostCSS 8.5.6**: CSS processing
- **Custom design tokens**: Control room color palette

### Animation
- **Framer Motion 11.18.2**: Declarative animations with spring physics
- All transitions use `type: 'spring'` for natural movement
- Layout animations with `layoutId` for smooth transitions

### Build & Deploy
- **Static Export**: `output: 'export'` in next.config.js
- **pnpm 8.15.0**: Fast, disk-efficient package manager
- **ESLint**: Code quality and React best practices

## Project Structure

```
control-room/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles & Tailwind
│   │   ├── philosophy/
│   │   │   └── page.tsx        # Truth model, no hallucination contract
│   │   ├── architecture/
│   │   │   └── page.tsx        # Pipeline visualization
│   │   ├── safety/
│   │   │   └── page.tsx        # Four validation gates
│   │   ├── confidence/
│   │   │   └── page.tsx        # Confidence scoring demo
│   │   ├── consensus/
│   │   │   └── page.tsx        # Multi-model agreement
│   │   ├── lanes/
│   │   │   └── page.tsx        # Business operation flows
│   │   └── deploy/
│   │       └── page.tsx        # Deployment guidance
│   ├── components/             # Reusable components
│   │   ├── Navigation.tsx      # Top nav with active state
│   │   ├── PipelineFlow.tsx    # Interactive pipeline stages
│   │   ├── GateValidator.tsx   # Animated gate validation
│   │   ├── ConfidenceSlider.tsx # Live confidence calculator
│   │   ├── ConsensusVisualizer.tsx # Model agreement demo
│   │   └── LaneFlow.tsx        # Business lane flows
│   └── lib/                    # Utilities (currently empty)
├── public/                     # Static assets (currently empty)
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore patterns
├── LICENSE                    # Apache 2.0
├── README.md                  # User-facing documentation
├── ARCHITECTURE.md            # This file
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
├── pnpm-lock.yaml            # Lockfile
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## Design System

### Color Palette

```typescript
// Primary colors
control-bg: '#0a0e1a'           // Background
control-surface: '#131824'      // Cards/panels
control-border: '#1e293b'       // Borders
control-accent: '#3b82f6'       // Primary accent (blue)

// Gate-specific colors
gate-structural: '#3b82f6'      // Blue
gate-evidence: '#8b5cf6'        // Purple
gate-consistency: '#06b6d4'     // Cyan
gate-consensus: '#10b981'       // Green

// Status colors
control-success: '#10b981'      // Green
control-warning: '#f59e0b'      // Orange
control-error: '#ef4444'        // Red

// Text colors
control-text-primary: '#f8fafc'
control-text-secondary: '#cbd5e1'
control-text-muted: '#64748b'
```

### Typography

```css
/* Sans-serif (body, headings) */
font-family: Inter, system-ui, sans-serif;

/* Monospace (code, data) */
font-family: JetBrains Mono, monospace;
```

### Utility Classes

```css
/* Glass morphism panels */
.glass-panel {
  background: rgba(19, 24, 36, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(30, 41, 59, 0.5);
  border-radius: 0.5rem;
}

/* Brighter glass panels */
.glass-panel-bright {
  background: rgba(19, 24, 36, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(30, 41, 59, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
}

/* Gradient text */
.text-gradient {
  background: linear-gradient(to right, #3b82f6, #10b981);
  background-clip: text;
  color: transparent;
}

/* Interactive buttons */
.control-button {
  @apply glass-panel px-6 py-3 hover:bg-control-surface/60 
         transition-all duration-200 border-control-border/70 
         hover:border-control-accent/50 cursor-pointer;
}
```

## Component Architecture

### Page Components
All pages follow this pattern:
```typescript
'use client'  // Client component for interactivity

import { motion } from 'framer-motion'
import ComponentName from '@/components/ComponentName'

export default function PageName() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page content */}
        </motion.div>
      </div>
    </div>
  )
}
```

### Interactive Components
Pattern for stateful components:
```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function ComponentName() {
  const [state, setState] = useState(initialValue)
  
  return (
    <div className="glass-panel-bright p-8">
      {/* Interactive elements */}
      <AnimatePresence>
        {/* Conditional rendering with exit animations */}
      </AnimatePresence>
    </div>
  )
}
```

## Animation Patterns

### Spring Physics
```typescript
// Standard spring transition
transition={{
  type: 'spring',
  stiffness: 380,
  damping: 30
}}

// Slower, more deliberate
transition={{
  type: 'spring',
  stiffness: 200,
  damping: 25
}}
```

### Page Entrance
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Staggered Children
```typescript
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    {/* Content */}
  </motion.div>
))}
```

### Layout Animations
```typescript
<motion.div
  layoutId="uniqueId"
  initial={false}
  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
/>
```

## State Management

### Local Component State
Simple useState for component-specific state:
```typescript
const [activeTab, setActiveTab] = useState(0)
const [isOpen, setIsOpen] = useState(false)
```

### No Global State
- No Redux, Zustand, or context providers needed
- Each page/component is self-contained
- URL is the source of truth for navigation

## Performance Optimizations

### Static Generation
- All pages pre-rendered at build time
- No runtime data fetching
- Pure HTML + CSS + JS bundle

### Code Splitting
- Automatic route-based code splitting
- Each page loads only its required components
- Framer Motion tree-shaken to used features only

### Bundle Sizes
```
First Load JS shared by all: 87.4 kB
Largest page: /safety at 128 kB first load
Smallest page: /philosophy at 125 kB first load
```

### Image Optimization
- No images currently (uses emojis and SVG)
- If images added: use Next.js Image component
- `unoptimized: true` for static export compatibility

## Accessibility

### Standards
- WCAG AA compliance target
- Semantic HTML throughout
- Proper heading hierarchy (h1 → h2 → h3)

### Keyboard Navigation
- All interactive elements focusable
- Tab order follows visual order
- Enter/Space activates buttons
- Escape closes modals/dropdowns

### Screen Readers
- Descriptive aria-labels where needed
- Buttons have clear text content
- Motion respects `prefers-reduced-motion`

### Color Contrast
All text meets WCAG AA:
- Primary text (#f8fafc) on dark bg: 15.3:1
- Secondary text (#cbd5e1) on dark bg: 11.2:1
- Muted text (#64748b) on dark bg: 5.1:1

## Build Process

### Development
```bash
pnpm dev
# Runs on http://localhost:3000
# Hot module replacement enabled
```

### Production Build
```bash
pnpm build
# 1. Compiles TypeScript
# 2. Runs ESLint
# 3. Builds Next.js pages
# 4. Exports static HTML to /out
# 5. Optimizes CSS/JS bundles
```

### Build Configuration
```javascript
// next.config.js
const nextConfig = {
  output: 'export',           // Static export
  images: {
    unoptimized: true,        // Required for static export
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,        // Ensures proper routing
}
```

## Deployment

### GitHub Pages
- Build with `NEXT_PUBLIC_BASE_PATH=/PulZ`
- Deploy `out/` to gh-pages branch
- Accessible at `https://username.github.io/PulZ/`

### Netlify
- Connect repo
- Build command: `cd control-room && pnpm build`
- Publish directory: `control-room/out`

### Custom Domain
- Build without base path
- Deploy `out/` to any static host
- Configure DNS as needed

## Testing Strategy

### Type Safety
- TypeScript strict mode
- No `any` types allowed
- Build fails on type errors

### Linting
- ESLint with Next.js recommended rules
- React best practices enforced
- No unused variables/imports

### Manual Testing
- Visual regression testing (human review)
- Interaction testing on all components
- Keyboard navigation testing
- Screen reader testing (NVDA/VoiceOver)

### Performance
- Lighthouse audits post-deployment
- Target: >90 on all metrics
- Bundle size monitoring

## Future Enhancements

### Potential Additions
- [ ] Dark/light mode toggle (currently dark only)
- [ ] Internationalization (i18n)
- [ ] More interactive demos
- [ ] Code examples with syntax highlighting
- [ ] API documentation pages
- [ ] Search functionality

### Not Planned
- ❌ Backend/API (keeping it static)
- ❌ User authentication
- ❌ Database integration
- ❌ Real-time features

## Development Guidelines

### Code Style
- Functional components only
- Hooks for state management
- TypeScript interfaces over types
- Explicit return types on functions
- Descriptive variable names

### Component Organization
```typescript
// 1. Imports
import { motion } from 'framer-motion'
import { useState } from 'react'

// 2. Type definitions
interface Props {
  title: string
  items: Item[]
}

// 3. Constants
const DEFAULT_VALUE = 42

// 4. Component
export default function Component({ title, items }: Props) {
  // State
  const [active, setActive] = useState(0)
  
  // Handlers
  const handleClick = () => {
    setActive(prev => prev + 1)
  }
  
  // Render
  return (/* JSX */)
}

// 5. Helper functions (if needed)
function helperFunction() {
  // ...
}
```

### Git Workflow
1. Work in feature branch
2. Commit with conventional commits
3. Open PR with description
4. Review and merge to main
5. Deploy automatically via GitHub Actions

## References

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

Built with precision and care by 3D3D.ca
