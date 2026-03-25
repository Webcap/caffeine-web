# Caffeine TV

A premium cinematic streaming platform landing page built with Next.js 16.

## Overview

Caffeine TV is a modern streaming platform showcase featuring:
- 4K HDR streaming showcase
- Universal sync capabilities
- Live sports streaming
- Glassmorphism UI design
- Smooth animations and transitions

## Tech Stack

- **Framework**: Next.js 16.2.1
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **Fonts**: Inter, Outfit (Google Fonts)
- **Runtime**: Node.js 20+

## Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (port 3002)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Project Structure

```
caffeine-web/
├── src/app/
│   ├── page.tsx         # Main landing page
│   ├── layout.tsx       # Root layout
│   ├── globals.css      # Global styles & CSS variables
│   └── page.module.css  # Page-specific styles
├── public/
│   └── hero-mockup.png  # Hero image asset
├── next.config.ts       # Next.js configuration
├── package.json
└── tsconfig.json
```

## Key Features

- Responsive design with mobile-first approach
- Scroll-based navbar styling
- Glassmorphism cards and components
- CSS custom properties for theming
- Smooth scroll behavior

## Design System

| Variable | Value |
|----------|-------|
| `--primary` | #dc2626 (red) |
| `--background` | #0b0b0b (dark) |
| `--glass-bg` | rgba(255,255,255,0.03) |
| `--glass-border` | rgba(255,255,255,0.08) |

## License

&copy; 2026 Webcap Media. All rights reserved.