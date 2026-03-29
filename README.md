# Caffeine TV

A premium cinematic streaming platform landing page built with Next.js 16.

---

## About

Caffeine TV is a modern streaming platform showcase featuring:

- **4K HDR Streaming** - Crystal clear quality with ultra-low latency
- **Universal Sync** - Start on your TV, finish on your phone
- **Live Sports** - Never miss a moment with real-time broadcasts
- **Glassmorphism UI** - Modern, sleek visual design
- **Smooth Animations** - Polished transitions and micro-interactions

### Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| TypeScript | 5.x |
| Node.js | 20+ |

---

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd caffeine-web

# Install dependencies
npm install
```

---

## Usage

### Development

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Run ESLint
npm run lint
```

---

## Configuration

### Project Structure

```
caffeine-web/
├── src/app/
│   ├── page.tsx           # Main landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css       # Global styles & CSS variables
│   └── page.module.css   # Page-specific styles
├── public/
│   └── hero-mockup.png   # Hero image asset
├── next.config.ts        # Next.js configuration
├── package.json
└── tsconfig.json
```

### Environment Variables

Create a `.env.local` file for local environment variables (if needed).

### Design Tokens

CSS variables are defined in `src/app/globals.css`:

```css
:root {
  --primary: #dc2626;
  --background: #0b0b0b;
  --foreground: #ffffff;
  --text-muted: #9ca3af;
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.08);
}
```

---

## FAQ

### Why port 3002?

The dev server runs on port 3002 to avoid conflicts with other Next.js projects that default to port 3000.

### How do I add a new page?

1. Create a new route folder in `src/app/`
2. Add a `page.tsx` file for the route content
3. Optionally add `layout.tsx` for shared layout

### How do I customize the theme?

Edit the CSS variables in `src/app/globals.css` to change colors, spacing, and other design tokens.

### Can I use this for production?

This is a landing page template. For production deployment, you'll need to:
- Add actual streaming functionality
- Implement authentication
- Connect to a backend API
- Set up proper analytics

---

## License

&copy; 2026 Webcap Media. All rights reserved.