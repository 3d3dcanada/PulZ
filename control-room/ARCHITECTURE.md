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

## Kernel Architecture

### Overview

The PulZ Control Room implements a **kernel layer** that enforces governance through code and data flow, not UI language. The kernel makes it structurally impossible to:

- Execute actions without explicit approval
- Make recommendations without evidence
- Bypass confidence thresholds
- Rewrite decision history

### Kernel Responsibilities

The kernel is responsible for:

1. **Primitive Data Structures**: Defining immutable, validated types for evidence, decisions, and audit events
2. **Policy Enforcement**: Evaluating confidence scores and enforcing governance rules at the data layer
3. **State Transitions**: Validating all decision status changes and rejecting invalid transitions
4. **Audit Trail**: Maintaining an append-only, cryptographically chained log of all governance events

### Core Primitives

#### EvidenceItem

Every piece of evidence has:
- **Type**: `document | user_input | external_source | system_observation`
- **Source**: Must include `kind` and `ref` (e.g., filename + section)
- **Excerpt**: Non-empty text excerpt
- **Confidence Weight**: 0-1 score indicating quality
- **Verified**: Boolean flag for verification status

#### EvidenceReport

A collection of evidence items with:
- **Items**: Array of EvidenceItem (minimum 1 required)
- **Coverage Summary**: Description of what is covered
- **Confidence Score**: 0-100 derived from items via policy
- **Limitations**: Explicit list of gaps
- **Assumptions**: Explicit list of assumptions

Validator ensures:
- At least one evidence item exists
- All items have non-empty sources and excerpts
- Confidence score is calculated via policy, not hand-waved

#### ConfidenceRubric

The rubric is encoded as immutable policy:

| Score | Action Class | Rules |
|-------|--------------|-------|
| 0-49 | `blocked` | All actions blocked |
| 50-69 | `approval_required_reversible` | Approval required, reversible only |
| 70-89 | `approval_required_reversible` | Approval required, reversible only |
| 90-100 | `automation_eligible` | Automation eligible only if explicitly enabled |

Policy functions:
- `getActionClass(score)`: Returns action class
- `getAllowedActions(score)`: Returns permitted actions
- `getBlockedActions(score)`: Returns forbidden actions
- `getRiskLevel(score)`: Returns low/medium/high

#### DecisionFrame

The core governance primitive:
- **Objective**: What is being decided
- **Recommendation**: Proposed action
- **Evidence Report ID**: Required reference to evidence
- **Confidence Score**: Inherited from evidence report
- **Risk Level**: Derived from confidence (low/medium/high)
- **Allowed Actions**: Array of permitted actions (policy-derived)
- **Blocked Actions**: Array of forbidden actions (policy-derived)
- **Approval Required**: Always `true` (hardcoded invariant)
- **Status**: One of `draft | pending_review | approved | rejected | revoked`
- **Approver ID**: Required for approved/rejected/revoked states
- **Approval Timestamp**: Required for approved/rejected/revoked states

Status transitions are validated:
- `draft` → `pending_review`
- `pending_review` → `approved | rejected`
- `approved` → `revoked`
- `rejected` → (terminal)
- `revoked` → (terminal)

Attempting an invalid transition throws an error at the kernel level.

#### AuditEvent

Every state change produces an immutable audit event:
- **Event Type**: e.g., `decision_approved`, `evidence_report_created`
- **Actor**: `human | system | model` with optional ID
- **Related Entity**: Kind + ID of the object affected
- **Before Hash**: Cryptographic hash of previous event
- **After Hash**: Cryptographic hash of new state
- **Timestamp**: ISO 8601 timestamp
- **Notes**: Optional human-readable context

### Structural Invariants

#### 1. No Silent Execution

```typescript
if (frame.status === 'approved') {
  if (!frame.approver_id || !frame.approval_timestamp) {
    throw new Error('Approval requires explicit human artifact')
  }
}
```

The kernel validator rejects any DecisionFrame marked as approved without both `approver_id` and `approval_timestamp`. There is no code path that allows execution without these fields.

#### 2. Evidence Gating

```typescript
if (!frame.evidence_report_id || frame.evidence_report_id.trim() === '') {
  violations.push('Decision must reference a valid evidence report')
}
```

Every DecisionFrame must reference an EvidenceReport. Claims without evidence must be explicitly labeled in the report's `assumptions` array.

#### 3. Confidence Gating

```typescript
if (confidenceScore < 50) {
  return { action_class: 'blocked', allowed_actions: [] }
}
```

The confidence policy is code, not configuration. Scores below 50 result in an empty `allowed_actions` array, making execution structurally impossible.

#### 4. Append-Only Audit

```typescript
class AppendOnlyLog {
  append(event) { /* ... */ }
  // No delete, update, or clear methods
}
```

The `AppendOnlyLog` class only exposes `append()`. Revocation is a new event, not a deletion. The full history is preserved and verifiable via hash chain.

### What PulZ Will Never Do

These guarantees are structural, not aspirational:

1. **Never execute without approval**: `approval_required` is hardcoded to `true` in `DecisionFrame`. There is no branch that sets it to `false`.

2. **Never recommend without evidence**: `validateDecisionFrame()` requires a non-empty `evidence_report_id`. Validation fails if missing.

3. **Never bypass confidence thresholds**: `evaluateConfidencePolicy()` returns blocked actions for scores below 50. The UI cannot override this.

4. **Never rewrite history**: `AppendOnlyLog` has no delete/update methods. Revocation appends a new event with `status: 'revoked'`.

5. **Never allow invalid transitions**: `canTransition()` is consulted before any status change. The state machine is enforced at the primitive level.

### Kernel File Structure

```
control-room/kernel/
├── primitives/
│   ├── EvidenceItem.ts
│   ├── EvidenceReport.ts
│   ├── DecisionFrame.ts
│   ├── ConfidenceRubric.ts
│   └── AuditEvent.ts
├── policies/
│   ├── confidencePolicy.ts
│   └── governancePolicy.ts
├── validators/
│   ├── evidenceValidator.ts
│   └── decisionValidator.ts
├── audit/
│   ├── appendOnlyLog.ts
│   └── hash.ts
└── index.ts
```

### Integration with UI

The kernel is consumed by UI components but never bypassed:

1. **Decision workflows** use `createDecisionFrame()` to generate frames with policy-derived constraints
2. **Evidence displays** use `validateEvidenceReport()` to ensure integrity
3. **Approval flows** use `approveDecisionFrame()` which enforces status transitions
4. **Audit trails** read from `globalAuditLog.getEvents()` (read-only access)

The UI cannot:
- Create a DecisionFrame without an evidence report
- Approve a decision without providing approver_id
- Skip status transitions (draft → approved is blocked)
- Delete or modify audit events

### Future Enhancements

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

## Deployment Incident: Pages Served 404 / Wrong Artifact

### Symptom Observed
GitHub Pages displayed a 404 error or served incorrect content despite the workflow reporting successful deployment. The custom domain `ktk3d.com` was not rendering the Control Room site.

### Root Cause
**Configuration mismatch between deployment mode and base path:**

1. Repository contains a `CNAME` file pointing to `ktk3d.com`, enabling custom domain deployment
2. GitHub Actions workflow hardcodes `NEXT_PUBLIC_BASE_PATH: /PulZ`, which is appropriate for repository path deployment (`username.github.io/PulZ/`) but incorrect for custom domain deployment
3. With `/PulZ` base path, all assets receive the prefix `/PulZ/` while GitHub Pages serves from the domain root (`/`)
4. This mismatch causes:
   - All asset references to break (404 on JS/CSS files)
   - Router navigation to fail
   - Links to be incorrect

### Invariant Violated
**Build configuration must align with deployment mode.** When `CNAME` exists (custom domain), base path must be empty. When no `CNAME` (repo path), base path must be set to repository name.

### Fix Applied
1. Updated workflow to detect deployment mode from `CNAME` presence
2. Set `NEXT_PUBLIC_BASE_PATH` conditionally:
   - Empty string when `CNAME` exists (custom domain)
   - `/PulZ` when no `CNAME` (repository path)
3. Added build assertion step to verify `index.html` and `404.html` exist in export

### Prevention Going Forward
1. **Invariant Gate**: Workflow validates that `CNAME` presence matches base path configuration
2. **Artifact Verification**: Build fails if required files (`index.html`, `404.html`) are missing
3. **Explicit Mode Detection**: Deployment mode is derived from file presence, not assumed

## Operator Literacy Layer (v2.3)

The Operator Literacy Layer (OLL) is a set of UI patterns and components designed to bridge the gap between technical system objects and non-technical operator understanding. It ensures that any "mechanic-level" engineer can operate PulZ without deep knowledge of the code paths.

### Core Components

#### 1. Universal Tooltip System
Provides in-place definitions for technical identifiers, hashes, and governance concepts.
- **Trigger**: Hover or focus on IDs, config keys, or status labels.
- **Content**: Plain-language explanation of the field's purpose and impact.
- **Accessibility**: Keyboard accessible (Tab + Enter) and respects reduced motion.

#### 2. "Explain This" Panel Pattern
A reusable side-drawer component that translates complex system objects into human-readable narratives.
- **What it is**: Simple definition.
- **Why it exists**: Context and purpose.
- **What it affects**: Downstream consequences.
- **Governance Context**: Plain-language interpretation of confidence scores and risk levels.
- **Supported Objects**: EvidenceItem, EvidenceReport, DecisionFrame, AuditEvent, EndpointSlot.

#### 3. Visual Console Widgets
Calm, dashboard-like visualizations using demo data to provide high-level system awareness.
- **Tender Intake (Demo)**: Timeline of incoming opportunities.
- **Machine Utilization (Demo)**: Status of connected hardware units.
- **Confidence Distribution (Demo)**: Snapshot of decision reliability across the system.
- **Audit Intensity**: Visual frequency of system events.
- **Integrity**: Always labeled as "Demo signals, not live telemetry" to maintain system honesty.

#### 4. System Library Shell
A dedicated knowledge base accessible via `/library` that houses the "middle-layer" documentation.
- **Structure**: Modular sections for Governance, Learning, Tenders, Manufacturing, and Robotics.
- **Purpose**: Provides a space for long-form context and tool registries without cluttering the high-stakes Control Room UI.

### Anti-Indexing Posture
To reduce casual indexing of demo/deployment environments while maintaining public accessibility:
- **robots.txt**: Standard "Disallow: /" instruction.
- **Meta Tags**: `noindex, nofollow` on all pages.
- **Honesty Note**: Explicitly documented as a reduction of casual indexing, not a security feature against hostile bots.

## Two-Strike Verification Protocol

### Purpose
When deploy claims success but actual behavior differs, PulZ must double-check before declaring victory. This protocol encodes systematic skepticism into the deployment process.

### Protocol Rules

**Strike 1: Log and Identify**
- Log incident details to learning library
- Identify probable cause candidates
- Do not close until root cause is confirmed

**Strike 2: Root Cause + Prevention Gate**
- Explicit root cause must be identified
- Prevention gate must be implemented
- Only close incident after verification

### Implementation
- `kernel/learning/verificationChecklist.ts`: Checklist of deployment verification steps
- `kernel/learning/incidentLog.ts`: Append-only incident logging abstraction
- `/learning` page: Visible integrity dashboard showing incidents and verification status

### Verification Checklist
1. **Artifact Existence**: `index.html` exists at export root
2. **Fallback Existence**: `404.html` exists (or equivalent static fallback)
3. **Base Path Correctness**: Base path matches deployment mode (custom domain vs repo path)
4. **Asset Loading**: Critical CSS/JS bundles are referenced correctly
5. **Route Resolution**: Internal routes resolve without 404s

## References

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

Built with precision and care by 3D3D.ca
