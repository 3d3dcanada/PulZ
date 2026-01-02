# PulZ Control Room - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+
- pnpm (will auto-install if you have npm)

### Local Development

```bash
# 1. Navigate to control room
cd control-room

# 2. Install pnpm (if needed)
npm install -g pnpm

# 3. Install dependencies
pnpm install

# 4. Start development server
pnpm dev

# 5. Open browser
# Visit http://localhost:3000
```

### Build for Production

```bash
cd control-room
pnpm build

# Output in ./out/ directory
# Deployable to any static host
```

### Local Static Preview

```bash
cd control-room
pnpm build

# Option 1: Python
cd out
python3 -m http.server 3000

# Option 2: npx serve
npx serve out

# Option 3: Any static file server
```

## 🌐 Deploy to GitHub Pages

### Automatic (via GitHub Actions)

1. Push to `main` branch
2. GitHub Actions will automatically:
   - Build the site with `/PulZ` base path
   - Deploy to `gh-pages` branch
   - Publish to `https://yourusername.github.io/PulZ/`

### Manual

```bash
cd control-room

# Build with base path
NEXT_PUBLIC_BASE_PATH=/PulZ pnpm build

# Deploy out/ directory to gh-pages branch
# (use gh-pages npm package or manual git)
```

## 🎯 Deploy to Netlify

### Via UI

1. Connect your GitHub repo to Netlify
2. Build command: `cd control-room && pnpm build`
3. Publish directory: `control-room/out`
4. Deploy!

### Via CLI

```bash
cd control-room
pnpm build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=out
```

## 🏠 Deploy to Custom Domain

```bash
cd control-room

# Build without base path
pnpm build

# Deploy out/ to your hosting:
# - Vercel: `vercel --prod`
# - Cloudflare Pages: `wrangler pages publish out`
# - AWS S3: `aws s3 sync out/ s3://your-bucket`
# - Any static host: Upload out/ directory
```

## 🔧 Configuration

### Base Path (for GitHub Pages)
```bash
# Set before building
export NEXT_PUBLIC_BASE_PATH=/PulZ
pnpm build
```

### Environment Variables
None required! This is a fully static site with no API calls.

## 📁 Key Files

```
control-room/
├── src/
│   ├── app/           # All pages
│   └── components/    # Interactive components
├── public/            # Static assets (empty by default)
├── package.json       # Dependencies
├── next.config.js     # Static export config
├── tailwind.config.ts # Design system
└── README.md          # Full documentation
```

## 🎨 Customization

### Colors
Edit `control-room/tailwind.config.ts`:
```typescript
colors: {
  control: {
    accent: '#3b82f6',  // Change accent color
    // ...
  }
}
```

### Content
All pages in `control-room/src/app/*/page.tsx`
All components in `control-room/src/components/*.tsx`

### Navigation
Edit `control-room/src/components/Navigation.tsx`

## 🧪 Testing

```bash
# Lint
pnpm lint

# Type check
pnpm build  # Type checks during build

# Accessibility
# Use browser DevTools or lighthouse
pnpm build && npx serve out
# Then run Lighthouse audit
```

## 🐛 Troubleshooting

### pnpm not found
```bash
npm install -g pnpm
```

### Build fails with "Can't resolve"
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### 404 on GitHub Pages
Make sure `NEXT_PUBLIC_BASE_PATH=/PulZ` is set when building for GitHub Pages.

### Styles not loading
Static export requires `unoptimized: true` for images (already configured).

## 📊 Performance Check

After deploying, run Lighthouse:
1. Open site in Chrome
2. DevTools → Lighthouse tab
3. Run audit
4. Target: All scores >90

## 🔗 Helpful Links

- [Next.js Static Export Docs](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Netlify Docs](https://docs.netlify.com/)

## 💬 Support

- Issues: [GitHub Issues](https://github.com/3D3D/PulZ/issues)
- Docs: See `control-room/README.md`
- PulZ Bible: `../pulz-bible.txt`

---

**Built with ❤️ by 3D3D.ca**
