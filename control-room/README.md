# PulZ Control Room

**Governance-first, investor-grade control room for the PulZ AI Orchestration OS.**

This is the first public artifact of PulZ: an interactive experience site that demonstrates the core governance model, validation gates, confidence scoring, multi-model consensus, and business operation lanes.

## 🔗 Live Deployments

- **GitHub Pages**: [https://3d3d.github.io/PulZ/](https://3d3d.github.io/PulZ/)
- **Custom Domain**: [https://pulz.3d3d.ca](https://pulz.3d3d.ca) _(when configured)_

## 🎯 What This Is

This is **not** a marketing site. This is a control room interface that shows:

- **The 4-Gate Validation System**: Interactive demonstration of how every output passes through structural, evidence, consistency, and consensus gates
- **Confidence Scoring**: Live calculator showing how evidence quality, model agreement, and context completeness determine what requires approval
- **Multi-Model Consensus**: Visualization of what happens when AI models disagree, and how conflicts are surfaced (not hidden)
- **Business Lanes**: Real-world operation flows for quotes, emails, tenders, and website tasks
- **The Pipeline**: Input → Normalize → Plan → Execute → Validate → Store → Brief

Every claim is grounded in the PulZ Bible (in the parent repo). No hype words. No placeholders. No "coming soon."

## 🛡️ Core Principles

PulZ is built on four non-negotiables:

1. **One daily conversation** — not spam
2. **No hallucinations** — validated only
3. **No stupid questions** — context aware
4. **Maximum time back** — decision ready

## 🏗️ Built With

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Motion**: Framer Motion (spring physics, not easing)
- **Export**: Static site generation (`output: 'export'`)
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Build for Production

```bash
# Build static site
pnpm build

# Output in ./out/ directory
```

### Local Static Preview

```bash
# After building
cd out
python3 -m http.server 3000

# Or use any static file server
npx serve out
```

## 📦 Deployment

### GitHub Pages

1. Build with correct base path:
   ```bash
   NEXT_PUBLIC_BASE_PATH=/PulZ pnpm build
   ```

2. Deploy `out/` directory to `gh-pages` branch

3. Configure GitHub Pages to serve from `gh-pages` branch

### Netlify

1. Connect repository
2. Build command: `pnpm build`
3. Publish directory: `out`
4. No environment variables needed (static site)

### Custom Domain

1. Build without base path:
   ```bash
   pnpm build
   ```

2. Deploy `out/` directory to your hosting
3. Configure DNS to point to hosting provider

## 📁 Project Structure

```
control-room/
├── src/
│   ├── app/              # Next.js pages (App Router)
│   │   ├── page.tsx      # Home / Control Room
│   │   ├── philosophy/   # Truth model, no hallucination contract
│   │   ├── architecture/ # Pipeline, circuit breakers
│   │   ├── safety/       # Four validation gates
│   │   ├── confidence/   # Interactive confidence scoring
│   │   ├── consensus/    # Multi-model agreement/conflict
│   │   ├── lanes/        # Business operation flows
│   │   └── deploy/       # Deployment paths, checklist
│   ├── components/       # Interactive components
│   │   ├── Navigation.tsx
│   │   ├── PipelineFlow.tsx
│   │   ├── GateValidator.tsx
│   │   ├── ConfidenceSlider.tsx
│   │   ├── ConsensusVisualizer.tsx
│   │   └── LaneFlow.tsx
│   └── lib/              # Utilities (if needed)
├── public/               # Static assets
├── LICENSE               # Apache 2.0
├── README.md             # This file
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js        # Static export config
```

## 🎨 Design System

### Colors

- **Background**: `#0a0e1a` (control-bg)
- **Surface**: `#131824` (control-surface)
- **Accent**: `#3b82f6` (control-accent)
- **Gate Colors**:
  - Structural: `#3b82f6`
  - Evidence: `#8b5cf6`
  - Consistency: `#06b6d4`
  - Consensus: `#10b981`

### Typography

- **Sans**: Inter
- **Mono**: JetBrains Mono (for code/data)

### Motion

All animations use spring physics (`type: 'spring'`) for natural, precise movement. No easing curves.

## ♿ Accessibility

- Semantic HTML throughout
- WCAG AA compliant
- Keyboard navigation supported
- Focus indicators visible
- Color contrast meets standards
- Screen reader friendly

### Tested With

- axe DevTools
- Lighthouse Accessibility Audit
- Keyboard-only navigation

## 🧪 Performance

Target Lighthouse scores (all >90):

- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

## 🤝 Contributing

This is an investor + engineering handoff specification. Contributions should:

1. Follow existing code conventions
2. Maintain accessibility standards
3. Use spring physics for animations
4. Ground all claims in PulZ Bible
5. Avoid hype language
6. Add real interactivity (not placeholders)

### Git Workflow

- Work in feature branches
- Open PRs for review
- Never push directly to main
- Commit messages: clear, present tense
- PRs must pass linting and type checks

### Code Style

- TypeScript strict mode
- Functional components
- Hooks for state management
- Framer Motion for animations
- Tailwind for styling (no custom CSS unless necessary)

## 📄 License

Apache License 2.0 — see [LICENSE](./LICENSE) file.

Copyright 2026 3D3D.ca

## 🔗 Related

- **PulZ Bible**: `../pulz-bible.txt` (in parent repo)
- **3D3D.ca**: [https://3d3d.ca](https://3d3d.ca)
- **GitHub**: [https://github.com/3D3D/PulZ](https://github.com/3D3D/PulZ)

## 📞 Contact

For questions about PulZ or 3D3D:

- Website: [https://3d3d.ca](https://3d3d.ca)
- GitHub Issues: [PulZ Issues](https://github.com/3D3D/PulZ/issues)

---

**This system respects you. It won't act behind your back. It was built by adults.**
