# Developer Documentation

## Table of Contents
- [Architecture](#architecture)
- [Components](#components)
- [Styling Guide](#styling-guide)
- [Scripts](#scripts)

---

## Architecture

This is a Next.js 16 App Router project with client-side interactivity.

### Directory Structure

```
src/app/
├── page.tsx         # Landing page (Client Component)
├── layout.tsx       # Root layout (Server Component)
├── globals.css      # Global styles + CSS variables
└── page.module.css  # Unused (styles in globals.css)
```

### Rendering Strategy

- `layout.tsx`: Server Component (default)
- `page.tsx`: Client Component (`"use client"` directive) for scroll-based state

---

## Components

### Navbar
- Fixed position at top
- Applies `.scrolled` class when `window.scrollY > 50`
- Glass effect via backdrop-filter on scroll

### Hero Section
- Centered content with abstract background glow
- Animated fade-in entrance
- Mockup container with glassmorphism styling

### Features Grid
- 3-column responsive grid (`repeat(auto-fit, minmax(300px, 1fr))`)
- Glass cards with hover transitions

### Footer
- Minimal footer with logo and copyright

---

## Styling Guide

### CSS Variables (globals.css:1-12)

```css
:root {
  --background: #0b0b0b;
  --foreground: #ffffff;
  --primary: #dc2626;
  --primary-glow: rgba(220, 38, 38, 0.4);
  --secondary: #1f2937;
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(16px);
  --card-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
  --text-muted: #9ca3af;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Utility Classes

| Class | Purpose |
|-------|---------|
| `.glass` | Glassmorphism card with backdrop blur |
| `.gradient-text` | Text with gradient clip |
| `.btn-primary` | Primary CTA button (red) |
| `.btn-secondary` | Secondary button (glass) |
| `.nav` | Fixed navbar |
| `.logo` | Brand logo with badge |
| `.animate-fade-in` | Fade-in animation |
| `.glow-pulse` | Pulsing glow effect |

### Fonts

- **Headings**: Outfit (Google Fonts)
- **Body**: Inter (Google Fonts)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3002 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Adding New Features

1. Create component files in `src/app/components/` (create directory if needed)
2. Import fonts in `layout.tsx` if adding new Google Fonts
3. Add CSS variables to `globals.css` `:root` for theme consistency
4. Use existing utility classes before creating new styles

---

## Performance Notes

- Next.js Image component used for hero mockup (optimized loading)
- CSS-only animations (no external animation libraries)
- Minimal JavaScript (only scroll listener in page.tsx)