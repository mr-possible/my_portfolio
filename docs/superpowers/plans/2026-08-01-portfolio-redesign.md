# Portfolio UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the visual layer of the Astro portfolio as a dark-first, terminal-inspired "dev tool" design driven by formal design tokens and a small set of reusable primitives, so future content additions require no new design decisions.

**Architecture:** Design tokens live as CSS custom properties in `src/styles/global.css` and are exposed to Tailwind as semantic color names (`surface`, `content`, `edge`, `accent`) in `tailwind.config.mjs`. Every component consumes those semantic classes instead of raw hex or `var(--x)` arbitrary values. Five shared primitives (`Card`, `Badge`, `PromptLabel`, `Icon`, `Timeline`/`TimelineItem`) absorb all repeated markup; pages compose them. The About page is converted from a markdown wall into structured data (`src/data/about.ts`) rendered by an Astro page.

**Tech Stack:** Astro 5 (static output), Tailwind CSS 3.4 via `@astrojs/tailwind`, `@tailwindcss/typography`, Shiki (bundled with Astro) for code highlighting, Keystatic (dev-only) for blog authoring. No new npm dependencies are added by this plan.

## Global Constraints

- **No new npm dependencies.** Everything is achievable with the existing stack.
- **Astro 5, static output.** `astro.config.mjs` keeps `output: 'static'` and `site: 'https://www.sambhav.blog'`.
- **Dark mode is the default.** `<html class="dark">` with the existing inline no-flash script in `BaseLayout.astro` preserved. Light mode = absence of `.dark`.
- **Layout width stays `max-w-3xl` centered** on every page. No sidebar, no wider container.
- **No new images.** No screenshots, illustrations, or thumbnails are added.
- **Typography split:** JetBrains Mono for headings, nav, labels, metadata, tags, and code. Inter for body copy and prose paragraphs.
- **Radius:** `rounded-md` for cards, buttons, chips. Never `rounded-full` or `rounded-lg` for these.
- **Green (`--accent-secondary`) is used for the availability status dot only.** Nowhere else. Amber is the primary accent everywhere.
- **No animation library, no page transitions, no parallax.** Motion is limited to: card hover lift, cursor blink, status-dot pulse, scroll-entrance fade.
- **All motion must respect `prefers-reduced-motion: reduce`.**
- **Content is not rewritten.** Job history, bios, and project descriptions are transcribed verbatim when restructured. The only copy change permitted by the spec is the 404 page message.
- **Semantic Tailwind color classes only.** Use `bg-surface`, `text-content-muted`, `border-edge`, `text-accent` etc. Do NOT use `text-[var(--text-primary)]` arbitrary values, and do NOT use opacity modifiers (`text-accent/50`) on these colors — they are `var()`-backed and opacity modifiers will not work.

## Verification Approach

This repo has **no test runner**, and the design spec puts automated visual regression tests out of scope. Every task therefore uses this verification cycle instead of a unit-test cycle:

1. `npm run build` — must exit 0. This catches Astro compile errors, TypeScript prop-type errors, and broken imports. This is the "does it fail / does it pass" gate.
2. Visual check — start the dev server and inspect the affected pages with the Playwright MCP browser tools (`browser_navigate`, `browser_take_screenshot`, `browser_resize`, `browser_click`).

**Starting the dev server (do this once, keep it running):**

```bash
npm run dev
```

It serves on `http://localhost:4321`. If port 4321 is taken, Astro prints the actual port — use that.

**Toggling to light mode during a visual check:** click the theme toggle button in the header (`browser_click` on the element with `aria-label="Toggle dark mode"`), or run `browser_evaluate` with:

```js
() => { document.documentElement.classList.toggle('dark'); }
```

**Checking mobile layout:** `browser_resize` to `375 x 812`, then screenshot.

---

## File Structure

**Create:**

| File | Responsibility |
|---|---|
| `src/data/icons.ts` | Single source of truth for all inline SVG path data |
| `src/data/about.ts` | Structured About-page content (experience, education, skills, misc) |
| `src/styles/prose.ts` | The shared Tailwind Typography class string used by both prose layouts |
| `src/components/Icon.astro` | Renders a named SVG from `icons.ts` |
| `src/components/Card.astro` | Bordered container with hover lift — base of every card on the site |
| `src/components/Badge.astro` | Mono chip for skill tags and blog tags |
| `src/components/PromptLabel.astro` | `$ command`-style section heading |
| `src/components/Timeline.astro` | Vertical rail wrapper for About experience |
| `src/components/TimelineItem.astro` | One experience entry within the rail |
| `src/pages/about.astro` | Restructured About page (replaces `about.md`) |
| `docs/DESIGN.md` | The durable style reference |

**Modify:** `src/styles/global.css`, `tailwind.config.mjs`, `astro.config.mjs`, `src/data/site.ts`, `src/layouts/BaseLayout.astro`, `src/layouts/MarkdownLayout.astro`, `src/layouts/BlogPostLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/ThemeToggle.astro`, `src/components/SocialLinks.astro`, `src/components/BlogPostMeta.astro`, `src/components/ProjectCard.astro`, `src/components/BlogPostCard.astro`, `src/pages/index.astro`, `src/pages/projects.astro`, `src/pages/blog/index.astro`, `src/pages/blog/tag/[tag].astro`, `src/pages/404.astro`

**Delete:** `src/pages/about.md`

---

## Task 1: Design tokens, Tailwind theme, fonts, motion foundation

Establishes the entire visual foundation. Nothing looks "finished" after this task, but the page background, text colors, and fonts all change — that's the observable deliverable.

**Files:**
- Modify: `src/styles/global.css` (full rewrite)
- Modify: `tailwind.config.mjs` (full rewrite)
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - CSS custom properties: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--border`, `--accent`, `--accent-hover`, `--accent-muted`, `--accent-secondary`
  - Tailwind semantic colors: `surface`, `surface-raised`, `content`, `content-muted`, `edge`, `accent`, `accent-hover`, `accent-muted`, `accent-green`
  - Utility classes: `.cursor-blink`, `.status-pulse`, `.reveal` (+ `.is-visible` state, applied by the IntersectionObserver in `BaseLayout`)
  - `<html>` gets a `js` class when JavaScript is enabled

**Contrast values** (already computed — these hex values are chosen to pass WCAG AA, do not substitute others):

| Pair | Ratio | Requirement |
|---|---|---|
| `#e5e5e0` on `#0a0a0a` (dark body) | 15.7:1 | AA ✅ |
| `#8a8a85` on `#0a0a0a` (dark muted) | 5.7:1 | AA ✅ |
| `#f5a623` on `#0a0a0a` (dark accent) | 9.8:1 | AA ✅ |
| `#171717` on `#fafaf9` (light body) | 17.2:1 | AA ✅ |
| `#5c5c57` on `#fafaf9` (light muted) | 6.4:1 | AA ✅ |
| `#a15c00` on `#fafaf9` (light accent) | 5.0:1 | AA ✅ |
| `#16a34a` on `#fafaf9` (light status dot) | 3.2:1 | AA non-text ✅ |

- [ ] **Step 1: Rewrite `src/styles/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Light theme — active when `.dark` is absent from <html> */
  :root {
    --bg-primary: #fafaf9;
    --bg-secondary: #f1f0ee;
    --text-primary: #171717;
    --text-secondary: #5c5c57;
    --border: #e0ded8;
    --accent: #a15c00;
    --accent-hover: #7a4600;
    --accent-muted: rgba(161, 92, 0, 0.1);
    --accent-secondary: #16a34a;
  }

  .dark {
    --bg-primary: #0a0a0a;
    --bg-secondary: #141414;
    --text-primary: #e5e5e0;
    --text-secondary: #8a8a85;
    --border: #262622;
    --accent: #f5a623;
    --accent-hover: #ffc05c;
    --accent-muted: rgba(245, 166, 35, 0.12);
    --accent-secondary: #4ade80;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  /* Consistent keyboard focus treatment for every interactive element */
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
}

@layer utilities {
  /* Blinking block cursor — Home hero */
  .cursor-blink::after {
    content: '▋';
    margin-left: 0.15em;
    color: var(--accent);
    animation: cursor-blink 1s step-end infinite;
  }

  /* Pulsing availability dot */
  .status-pulse {
    animation: status-pulse 2s ease-in-out infinite;
  }

  /*
   * Scroll-entrance reveal. Gated behind `.js` so that with JavaScript
   * disabled the content renders normally instead of staying invisible.
   */
  .js .reveal {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
  }

  .js .reveal.is-visible {
    opacity: 1;
    transform: none;
  }
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes status-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.8);
  }
}

/*
 * Shiki emits both light and dark colors as CSS variables (configured with
 * `defaultColor: false` in astro.config.mjs). Bind them to the active theme.
 */
html:not(.dark) .astro-code,
html:not(.dark) .astro-code span {
  color: var(--shiki-light) !important;
  background-color: var(--shiki-light-bg) !important;
}

html.dark .astro-code,
html.dark .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .cursor-blink::after,
  .status-pulse {
    animation: none;
  }

  .js .reveal,
  .js .reveal.is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Rewrite `tailwind.config.mjs`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      // Semantic color roles backed by the CSS custom properties in
      // global.css. Because the values are var()-based, Tailwind opacity
      // modifiers (e.g. `text-accent/50`) do NOT work on these — use the
      // dedicated `accent-muted` token instead.
      colors: {
        surface: {
          DEFAULT: 'var(--bg-primary)',
          raised: 'var(--bg-secondary)',
        },
        content: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
        },
        edge: 'var(--border)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          green: 'var(--accent-secondary)',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

- [ ] **Step 3: Enable dual-theme Shiki in `astro.config.mjs`**

Replace the `markdown` block (lines 20-24) with:

```js
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
```

Leave the rest of the file unchanged.

- [ ] **Step 4: Update `src/layouts/BaseLayout.astro`**

Full replacement of the file:

```astro
---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { siteConfig } from '../data/site';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
}

const { title, description } = Astro.props;
const pageTitle = title ? `${title} | ${siteConfig.title}` : siteConfig.title;
const pageDescription = description || siteConfig.tagline;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={pageDescription} />
    <meta name="author" content={siteConfig.author} />
    <link rel="canonical" href={canonicalURL} />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <link rel="alternate" type="application/rss+xml" title={siteConfig.title} href="/rss.xml" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
    />

    <!-- OpenGraph -->
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={pageDescription} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalURL} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content={pageTitle} />
    <meta name="twitter:description" content={pageDescription} />

    <title>{pageTitle}</title>

    <!-- Prevent dark mode flash; flag JS for the reveal animation -->
    <script is:inline>
      document.documentElement.classList.add('js');
      const theme = localStorage.getItem('theme');
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (!theme) {
        // Default to dark
        document.documentElement.classList.add('dark');
      }
    </script>
  </head>
  <body class="bg-surface text-content min-h-screen flex flex-col font-sans antialiased">
    <Header />
    <main class="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
      <slot />
    </main>
    <Footer />

    <script>
      const revealables = document.querySelectorAll('.reveal');

      if (!('IntersectionObserver' in window)) {
        revealables.forEach((el) => el.classList.add('is-visible'));
      } else {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
              }
            });
          },
          { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
        );

        revealables.forEach((el) => observer.observe(el));
      }
    </script>
  </body>
</html>
```

- [ ] **Step 5: Build to verify nothing broke**

Run: `npm run build`
Expected: exits 0. The existing pages still use `var(--...)` arbitrary classes at this point — that's fine, those custom properties still exist, so the site renders with the new palette immediately.

- [ ] **Step 6: Visual check of the new foundation**

Start `npm run dev`, then navigate to `http://localhost:4321/` and screenshot.
Confirm: page background is near-black (`#0a0a0a`, noticeably darker/warmer than the previous slate blue), body text is off-white, and links/accents are **amber**, not indigo. Fonts should now actually be Inter (previously the site silently fell back to system fonts because neither font was ever loaded).

Toggle to light mode and screenshot. Confirm: warm off-white background, dark text, darker amber accents.

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css tailwind.config.mjs astro.config.mjs src/layouts/BaseLayout.astro
git commit -m "feat(design): add terminal design tokens, load fonts, add motion foundation"
```

---

## Task 2: Icon primitive and site chrome

Rethemes everything that appears on every page, so the rest of the work happens inside a finished frame.

**Files:**
- Create: `src/data/icons.ts`
- Create: `src/components/Icon.astro`
- Modify: `src/data/site.ts`
- Modify: `src/components/SocialLinks.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/ThemeToggle.astro`

**Interfaces:**
- Consumes: Tailwind semantic colors from Task 1.
- Produces:
  - `src/data/icons.ts` exports `iconPaths: Record<IconName, string>` and `type IconName = 'github' | 'twitter' | 'linkedin' | 'medium' | 'youtube' | 'play'`
  - `Icon.astro` props: `{ name: IconName; class?: string }` (default class `w-5 h-5`)
  - `siteConfig.terminal` — `{ user: string; host: string; cwd: string }`

- [ ] **Step 1: Create `src/data/icons.ts`**

The five social paths are moved verbatim out of `SocialLinks.astro`; `play` is new (used by project video links in Task 3).

```ts
export const iconPaths = {
  github:
    'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
  twitter:
    'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  medium:
    'M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z M9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  play: 'M8 5v14l11-7L8 5z',
} as const;

export type IconName = keyof typeof iconPaths;
```

- [ ] **Step 2: Create `src/components/Icon.astro`**

```astro
---
import { iconPaths, type IconName } from '../data/icons';

interface Props {
  name: IconName;
  class?: string;
}

const { name, class: className = 'w-5 h-5' } = Astro.props;
---

<svg class={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d={iconPaths[name]} />
</svg>
```

- [ ] **Step 3: Add the terminal prompt config to `src/data/site.ts`**

Insert a `terminal` key immediately after `avatar` (keep everything else unchanged):

```ts
  avatar: '/images/dp.jpg',
  terminal: {
    user: 'sambhav',
    host: 'portfolio',
    cwd: '~',
  },
```

- [ ] **Step 4: Rewrite `src/components/SocialLinks.astro` to use `Icon`**

```astro
---
import Icon from './Icon.astro';
import { siteConfig } from '../data/site';
import type { IconName } from '../data/icons';

interface Props {
  class?: string;
}

const { class: className = '' } = Astro.props;
---

<div class:list={['flex gap-1 items-center', className]}>
  {
    siteConfig.social.map((link) => (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.name}
        class="p-2 rounded-md text-content-muted hover:text-accent hover:bg-surface-raised transition-colors"
      >
        <Icon name={link.icon as IconName} class="w-5 h-5" />
      </a>
    ))
  }
</div>
```

- [ ] **Step 5: Rewrite `src/components/Header.astro`**

```astro
---
import { siteConfig } from '../data/site';
import ThemeToggle from './ThemeToggle.astro';

const currentPath = Astro.url.pathname;
const { user, host, cwd } = siteConfig.terminal;

function isActive(path: string): boolean {
  if (path === '/') return currentPath === '/';
  return currentPath === path || currentPath.startsWith(`${path}/`);
}
---

<header class="border-b border-edge">
  <nav class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
    <a
      href="/"
      class="font-mono text-sm sm:text-base tracking-tight hover:opacity-80 transition-opacity"
      aria-label={siteConfig.title}
    >
      <span class="text-accent">{user}</span><span class="text-content-muted">@{host}</span><span
        class="text-content-muted">:{cwd}$</span
      >
    </a>

    <!-- Desktop nav -->
    <div class="hidden md:flex items-center gap-6">
      {
        siteConfig.nav.map((item) => (
          <a
            href={item.path}
            aria-current={isActive(item.path) ? 'page' : undefined}
            class:list={[
              'font-mono text-sm pb-1 border-b-2 transition-colors',
              isActive(item.path)
                ? 'text-accent border-accent'
                : 'text-content-muted border-transparent hover:text-content',
            ]}
          >
            {item.name.toLowerCase()}
          </a>
        ))
      }
      <ThemeToggle />
    </div>

    <!-- Mobile menu button -->
    <div class="flex items-center gap-1 md:hidden">
      <ThemeToggle />
      <button
        id="mobile-menu-btn"
        type="button"
        aria-label="Toggle menu"
        aria-expanded="false"
        aria-controls="mobile-menu"
        class="p-2 rounded-md text-content-muted hover:text-accent hover:bg-surface-raised transition-colors"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path id="menu-open" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          <path id="menu-close" class="hidden" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>

  <!-- Mobile nav -->
  <div id="mobile-menu" class="hidden md:hidden border-t border-edge">
    <div class="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-1">
      {
        siteConfig.nav.map((item) => (
          <a
            href={item.path}
            aria-current={isActive(item.path) ? 'page' : undefined}
            class:list={[
              'font-mono text-sm py-2 pl-3 border-l-2 transition-colors',
              isActive(item.path)
                ? 'text-accent border-accent'
                : 'text-content-muted border-transparent hover:text-content',
            ]}
          >
            {item.name.toLowerCase()}
          </a>
        ))
      }
    </div>
  </div>
</header>

<script>
  const btn = document.getElementById('mobile-menu-btn')!;
  const menu = document.getElementById('mobile-menu')!;
  const openIcon = document.getElementById('menu-open')!;
  const closeIcon = document.getElementById('menu-close')!;

  btn.addEventListener('click', () => {
    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    openIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', String(willOpen));
  });
</script>
```

Note: this also fixes a latent bug in the old header — `aria-expanded` was never updated, and the `isOpen` variable was computed but unused.

- [ ] **Step 6: Rewrite `src/components/Footer.astro`**

```astro
---
import SocialLinks from './SocialLinks.astro';
import { siteConfig } from '../data/site';

const year = new Date().getFullYear();
---

<footer class="border-t border-edge mt-auto">
  <div class="max-w-3xl mx-auto px-4 py-8 flex flex-col items-center gap-3">
    <SocialLinks />
    <p class="font-mono text-xs text-content-muted">
      <span class="text-accent">$</span> echo "&copy; {year} {siteConfig.author}"
    </p>
  </div>
</footer>
```

- [ ] **Step 7: Retheme `src/components/ThemeToggle.astro`**

Change only the `class` attribute on the `<button>` (line 8) from:

```
class="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
```

to:

```
class="p-2 rounded-md text-content-muted hover:text-accent hover:bg-surface-raised transition-colors"
```

Leave the two SVGs and the whole `<script>` block untouched.

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 9: Visual check of the chrome**

Navigate to `http://localhost:4321/` and screenshot.
Confirm: header logo reads `sambhav@portfolio:~$` with `sambhav` in amber; nav items are lowercase monospace; the active item (`home`) has an amber underline; footer shows `$ echo "© 2026 Sambhav Dave"` in mono.

Navigate to `/projects` and confirm the amber underline moved to `projects`.

`browser_resize` to `375 x 812`, screenshot, click the hamburger, screenshot again. Confirm the mobile menu opens and the active item has an amber left border.

- [ ] **Step 10: Commit**

```bash
git add src/data/icons.ts src/components/Icon.astro src/data/site.ts src/components/SocialLinks.astro src/components/Header.astro src/components/Footer.astro src/components/ThemeToggle.astro
git commit -m "feat(design): add Icon primitive and reskin site chrome"
```

---

## Task 3: Card, Badge, PromptLabel primitives + Projects page

Introduces the three primitives that the rest of the site composes from, and proves them out on the Projects page.

**Files:**
- Create: `src/components/Card.astro`
- Create: `src/components/Badge.astro`
- Create: `src/components/PromptLabel.astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/pages/projects.astro`

**Interfaces:**
- Consumes: `Icon.astro` (`{ name: IconName; class?: string }`) from Task 2.
- Produces:
  - `Card.astro` props: `{ as?: 'div' | 'article' | 'li'; interactive?: boolean; class?: string }` — `interactive` defaults to `true` and controls the hover lift.
  - `Badge.astro` props: `{ href?: string; class?: string }` — renders `<a>` when `href` is set, `<span>` otherwise.
  - `PromptLabel.astro` props: `{ command: string; as?: 'h1' | 'h2' | 'h3'; class?: string }` — `as` defaults to `'h2'` and also selects the font size.

- [ ] **Step 1: Create `src/components/Card.astro`**

```astro
---
interface Props {
  as?: 'div' | 'article' | 'li';
  interactive?: boolean;
  class?: string;
}

const { as: Tag = 'div', interactive = true, class: className = '' } = Astro.props;
---

<Tag
  class:list={[
    'rounded-md border border-edge bg-surface-raised p-5 transition-all duration-200',
    interactive && 'hover:border-accent hover:-translate-y-0.5',
    className,
  ]}
>
  <slot />
</Tag>
```

- [ ] **Step 2: Create `src/components/Badge.astro`**

```astro
---
interface Props {
  href?: string;
  class?: string;
}

const { href, class: className = '' } = Astro.props;

const base =
  'inline-block font-mono text-xs leading-5 px-2 py-0.5 rounded-md bg-accent-muted text-accent border border-transparent';
---

{
  href ? (
    <a href={href} class:list={[base, 'hover:border-accent transition-colors', className]}>
      <slot />
    </a>
  ) : (
    <span class:list={[base, className]}>
      <slot />
    </span>
  )
}
```

- [ ] **Step 3: Create `src/components/PromptLabel.astro`**

```astro
---
interface Props {
  command: string;
  as?: 'h1' | 'h2' | 'h3';
  class?: string;
}

const { command, as: Tag = 'h2', class: className = '' } = Astro.props;

const sizes = {
  h1: 'text-2xl sm:text-3xl',
  h2: 'text-xl sm:text-2xl',
  h3: 'text-lg',
} as const;
---

<Tag class:list={['font-mono font-semibold text-content', sizes[Tag], className]}>
  <span class="text-accent select-none" aria-hidden="true">$&nbsp;</span>{command}
</Tag>
```

- [ ] **Step 4: Rewrite `src/components/ProjectCard.astro`**

```astro
---
import Card from './Card.astro';
import Badge from './Badge.astro';
import Icon from './Icon.astro';
import type { Project } from '../data/projects';

interface Props {
  project: Project;
}

const { project } = Astro.props;

const linkClass =
  'inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1.5 rounded-md border border-edge text-content-muted hover:text-accent hover:border-accent transition-colors';
---

<Card as="article" class="flex flex-col h-full">
  <h3 class="font-mono text-base font-semibold leading-snug mb-2">{project.title}</h3>
  <p class="text-sm text-content-muted mb-4 flex-1">{project.description}</p>

  <div class="flex flex-wrap gap-1.5 mb-4">
    {project.skills.map((skill) => <Badge>{skill}</Badge>)}
  </div>

  <div class="flex flex-wrap gap-2">
    <a href={project.github} target="_blank" rel="noopener noreferrer" class={linkClass}>
      <Icon name="github" class="w-3.5 h-3.5" />
      Code
    </a>
    {
      project.video && (
        <a href={project.video} target="_blank" rel="noopener noreferrer" class={linkClass}>
          <Icon name="play" class="w-3.5 h-3.5" />
          Video
        </a>
      )
    }
  </div>
</Card>
```

- [ ] **Step 5: Rewrite `src/pages/projects.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProjectCard from '../components/ProjectCard.astro';
import PromptLabel from '../components/PromptLabel.astro';
import { projects } from '../data/projects';
---

<BaseLayout title="Projects" description="Projects by Sambhav Dave">
  <header class="mb-8">
    <PromptLabel command="ls ~/projects" as="h1" />
    <p class="text-content-muted mt-2 text-sm">
      {projects.length} things I have built, broken, and rebuilt.
    </p>
  </header>

  <div class="grid gap-4 sm:grid-cols-2 reveal">
    {projects.map((project) => <ProjectCard project={project} />)}
  </div>
</BaseLayout>
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 7: Visual check of Projects**

Navigate to `http://localhost:4321/projects` and screenshot.
Confirm: heading reads `$ ls ~/projects` with an amber `$`; cards have a raised dark background with a subtle border; skill tags are amber-tinted mono chips with square-ish corners; each card has `Code` (and where applicable `Video`) as a bordered icon button, not a bare underlined link. All cards in a row are equal height.

Hover a card (`browser_hover`) and screenshot — the border should turn amber and the card should lift slightly.

Resize to `375 x 812` — the grid should collapse to one column.

Toggle light mode and screenshot — chips and buttons must remain readable.

- [ ] **Step 8: Commit**

```bash
git add src/components/Card.astro src/components/Badge.astro src/components/PromptLabel.astro src/components/ProjectCard.astro src/pages/projects.astro
git commit -m "feat(design): add Card/Badge/PromptLabel primitives and rebuild Projects"
```

---

## Task 4: Blog list, post card, metadata, tag page

**Files:**
- Modify: `src/components/BlogPostMeta.astro`
- Modify: `src/components/BlogPostCard.astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/tag/[tag].astro`

**Interfaces:**
- Consumes: `Card.astro`, `Badge.astro`, `PromptLabel.astro` from Task 3.
- Produces: `BlogPostMeta.astro` keeps its existing props `{ pubDate: Date; tags?: string[] }` — no signature change, only markup.

- [ ] **Step 1: Rewrite `src/components/BlogPostMeta.astro`**

```astro
---
import Badge from './Badge.astro';

interface Props {
  pubDate: Date;
  tags?: string[];
}

const { pubDate, tags = [] } = Astro.props;

const formattedDate = pubDate.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});
---

<div class="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-content-muted">
  <time datetime={pubDate.toISOString()}>{formattedDate}</time>
  {
    tags.length > 0 && (
      <>
        <span aria-hidden="true">/</span>
        <div class="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge href={`/blog/tag/${tag}`}>#{tag}</Badge>
          ))}
        </div>
      </>
    )
  }
</div>
```

- [ ] **Step 2: Rewrite `src/components/BlogPostCard.astro`**

```astro
---
import Card from './Card.astro';
import BlogPostMeta from './BlogPostMeta.astro';

interface Props {
  post: {
    id: string;
    data: {
      title: string;
      description: string;
      pubDate: Date;
      tags: string[];
    };
  };
}

const { post } = Astro.props;
---

<Card as="article" class="group">
  <a href={`/blog/${post.id}`} class="block">
    <h2
      class="font-mono text-lg font-semibold leading-snug mb-2 group-hover:text-accent transition-colors"
    >
      {post.data.title}
    </h2>
  </a>
  <BlogPostMeta pubDate={post.data.pubDate} tags={post.data.tags} />
  <p class="text-sm text-content-muted mt-3">{post.data.description}</p>
</Card>
```

- [ ] **Step 3: Rewrite `src/pages/blog/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogPostCard from '../../components/BlogPostCard.astro';
import PromptLabel from '../../components/PromptLabel.astro';

const allPosts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? data.draft !== true : true;
});

const sortedPosts = allPosts.sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);
---

<BaseLayout title="Blog" description="Thoughts on software engineering, testing, and more.">
  <header class="mb-8">
    <PromptLabel command="cat ~/blog/*" as="h1" />
    <p class="text-content-muted mt-2 text-sm">
      Notes on testing, automation, and building software.
    </p>
  </header>

  {
    sortedPosts.length === 0 ? (
      <p class="font-mono text-sm text-content-muted">No posts yet. Check back soon!</p>
    ) : (
      <div class="space-y-4 reveal">
        {sortedPosts.map((post) => (
          <BlogPostCard post={post} />
        ))}
      </div>
    )
  }
</BaseLayout>
```

- [ ] **Step 4: Rewrite `src/pages/blog/tag/[tag].astro`**

Keep the `getStaticPaths` block exactly as it is; replace only the frontmatter imports and the template.

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import BlogPostCard from '../../../components/BlogPostCard.astro';
import PromptLabel from '../../../components/PromptLabel.astro';

export async function getStaticPaths() {
  const allPosts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const allTags = [...new Set(allPosts.flatMap((post) => post.data.tags))];

  return allTags.map((tag) => ({
    params: { tag },
    props: {
      posts: allPosts
        .filter((post) => post.data.tags.includes(tag))
        .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()),
    },
  }));
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---

<BaseLayout title={`Posts tagged "${tag}"`}>
  <header class="mb-8">
    <PromptLabel command={`grep -r "#${tag}"`} as="h1" />
    <p class="font-mono text-content-muted mt-2 text-sm">
      {posts.length} post{posts.length !== 1 ? 's' : ''}
    </p>
  </header>

  <div class="space-y-4 reveal">
    {posts.map((post) => <BlogPostCard post={post} />)}
  </div>

  <a
    href="/blog"
    class="inline-block font-mono text-sm text-accent hover:text-accent-hover mt-8 transition-colors"
  >
    &larr; all posts
  </a>
</BaseLayout>
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 6: Visual check of Blog**

Navigate to `http://localhost:4321/blog` and screenshot.
Confirm: heading is `$ cat ~/blog/*`; post cards match the Projects card treatment; date is mono; tags render as `#tag` amber chips.

Click a tag chip and confirm the tag page renders with a `$ grep -r "#tag"` heading and the same card styling.

Toggle light mode and screenshot both pages.

- [ ] **Step 7: Commit**

```bash
git add src/components/BlogPostMeta.astro src/components/BlogPostCard.astro src/pages/blog/index.astro src/pages/blog/tag/\[tag\].astro
git commit -m "feat(design): rebuild blog list, post cards, and tag pages on shared primitives"
```

---

## Task 5: Home hero

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `PromptLabel.astro`, `BlogPostCard.astro`, `SocialLinks.astro`, and the `.cursor-blink` / `.status-pulse` / `.reveal` utilities from Task 1.
- Produces: nothing consumed by later tasks.

The status dot and blinking cursor are inline elements here, not separate components — per the spec, they are used exactly once.

- [ ] **Step 1: Rewrite `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import SocialLinks from '../components/SocialLinks.astro';
import BlogPostCard from '../components/BlogPostCard.astro';
import PromptLabel from '../components/PromptLabel.astro';
import { siteConfig } from '../data/site';

const recentPosts = (
  await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  })
)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);

const [firstName, ...restName] = siteConfig.author.split(' ');
---

<BaseLayout>
  <section class="flex flex-col items-center text-center pb-16">
    <img
      src={siteConfig.avatar}
      alt={siteConfig.author}
      class="w-28 h-28 rounded-md object-cover mb-6 border border-edge"
      width="112"
      height="112"
    />

    <h1 class="font-mono text-3xl sm:text-4xl font-bold tracking-tight">
      <span class="text-accent">{firstName}</span>
      <span>{restName.join(' ')}</span>
    </h1>

    <p class="font-mono text-sm text-content-muted mt-3">{siteConfig.description}</p>

    <p class="mt-5 max-w-lg text-content-muted cursor-blink">{siteConfig.tagline}</p>

    <p class="flex items-center gap-2 mt-6 font-mono text-xs text-content-muted">
      <span class="status-pulse inline-block w-2 h-2 rounded-full bg-accent-green" aria-hidden="true"
      ></span>
      Available for opportunities
    </p>

    <SocialLinks class="mt-6" />
  </section>

  {
    recentPosts.length > 0 && (
      <section class="reveal">
        <div class="flex items-baseline justify-between mb-6 gap-4">
          <PromptLabel command="tail -3 ~/blog" />
          <a
            href="/blog"
            class="font-mono text-xs text-accent hover:text-accent-hover transition-colors whitespace-nowrap"
          >
            view all &rarr;
          </a>
        </div>
        <div class="space-y-4">
          {recentPosts.map((post) => (
            <BlogPostCard post={post} />
          ))}
        </div>
      </section>
    )
  }
</BaseLayout>
```

Note: the avatar moves from `rounded-full` to `rounded-md` to match the global radius constraint.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Visual check of Home**

Navigate to `http://localhost:4321/` and screenshot.
Confirm: "Sambhav" renders in amber and "Dave" in body color, both monospace; a green dot pulses next to "Available for opportunities" (green appears **only** here); an amber block cursor blinks at the end of the tagline; the recent-posts heading reads `$ tail -3 ~/blog`.

Take a second screenshot ~1 second later and confirm the cursor's opacity differs (proves the blink animation is running).

Toggle light mode and screenshot.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(design): rebuild home hero with status dot and cursor accent"
```

---

## Task 6: About page restructure

The largest task. Converts `src/pages/about.md` into structured data plus an Astro page, and adds the timeline primitives. **All strings are transcribed verbatim from the existing `about.md`** — no rewording.

**Files:**
- Create: `src/data/about.ts`
- Create: `src/components/Timeline.astro`
- Create: `src/components/TimelineItem.astro`
- Create: `src/pages/about.astro`
- Delete: `src/pages/about.md`

**Interfaces:**
- Consumes: `Card.astro`, `Badge.astro`, `PromptLabel.astro` from Task 3.
- Produces:
  - `src/data/about.ts` exports `summary: string`, `education: EducationEntry[]`, `experience: ExperienceEntry[]`, `skillGroups: SkillGroup[]`, `misc: { label: string; value: string }[]`, `activities: ActivityEntry[]`, `hobbies: string`
  - `Timeline.astro` props: `{ class?: string }` — renders `<ol>`, expects `TimelineItem` children
  - `TimelineItem.astro` props: `{ role: string; org: string; duration: string; location: string; mode: string }` — body content passed via slot

- [ ] **Step 1: Create `src/data/about.ts`**

```ts
export interface EducationEntry {
  period: string;
  university: string;
  location: string;
  degree: string;
  grade: string;
}

export interface Award {
  title: string;
  description: string;
}

export interface ExperienceEntry {
  role: string;
  org: string;
  duration: string;
  location: string;
  mode: string;
  routine: string;
  highlights: string[];
  stack: string;
  awards?: Award[];
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ActivityEntry {
  title: string;
  year: string;
  points: string[];
}

export const summary =
  'I am a passionate and detail-oriented Software Engineer/SDET from India. With a keen interest in ensuring software quality and delivering robust solutions, I bring a unique blend of technical skills and a quality-focused mindset.';

export const education: EducationEntry[] = [
  {
    period: '2023 - 2024',
    university: 'Swansea University',
    location: 'Swansea, United Kingdom',
    degree: 'Master of Science - Computer Science',
    grade: 'Distinction',
  },
  {
    period: '2015 - 2019',
    university: 'Chhattisgarh Swami Vivekananda Technical University',
    location: 'Bhilai, India',
    degree: 'Bachelor of Engineering - Computer Science',
    grade: '8.65 out of 10 (Honors Division)',
  },
];

export const experience: ExperienceEntry[] = [
  {
    role: 'Senior SDET',
    org: 'SeekOut',
    duration: 'Mar/2025 - Present',
    location: 'Bangalore, Karnataka, India',
    mode: 'Hybrid | Full-time',
    routine:
      'SQA, Scrum Meetings, PR reviews, Debugging, Test Automation, Product Smoke and Regression Testing',
    highlights: [
      'Architected the core test strategy for Outreach platform within the engineering team.',
      'Wrote service level unit and integration tests for NestJS backend services.',
      'Solely involved as principle QA for in-sprint testing of new features.',
      'Doing code reviews for test automation code ensuring industry standard code quality.',
    ],
    stack: 'Typescript, Playwright, Azure DevOps, NestJS',
  },
  {
    role: 'Senior SDET',
    org: 'Xogene Services LLC',
    duration: 'Mar/2024 - Mar/2025',
    location: 'Pune, Maharashtra, India',
    mode: 'Remote | Full-time',
    routine: 'SQA, Scrum Meetings, PR reviews, Debugging, Test Automation',
    highlights: [
      'First automation tester who built the automation test infrastructure from scratch.',
      'Laid out the automation test strategy and created/maintained test automation deliverables.',
      'Helped the product testing team in writing efficient test cases.',
      'Added user centric locators to frontend for better and reliable automated testing.',
    ],
    stack: 'Java, Selenide, REST-assured, Docker, AWS',
  },
  {
    role: 'Student Teaching Assistant',
    org: 'Swansea University',
    duration: 'Oct/2023 - Dec/2023',
    location: 'Swansea, Wales, United Kingdom',
    mode: 'Onsite | Part-time',
    routine: 'Management of labs and resolving course related doubts of BSc/MSc students.',
    highlights: [
      'My job is to assist in labs of Java programming and Web Development modules.',
      'Both of these labs consist of ~100 students each, running twice a week for 2 hours.',
    ],
    stack: 'Java, Laravel, Tailwind CSS, React',
  },
  {
    role: 'Student Software Developer (Python Developer)',
    org: 'SAIL Databank',
    duration: 'Jun/2023 - Sept/2023',
    location: 'Swansea, Wales, United Kingdom',
    mode: 'Remote | Part-time',
    routine: 'Scrum Meetings & occasional supervisor meetups',
    highlights: [
      'Joined as a part-time developer intern to a team of 5 developers cum researchers in the field of Population Data Science.',
      'Main work revolved around feature development using Django, solving bugs and also developing an API client for internal use by researchers.',
    ],
    stack: 'Python, Tkinter, Django',
  },
  {
    role: 'Consultant (SDET)',
    org: 'Genpact Digital',
    duration: 'Mar/2021 - Dec/2022',
    location: 'Bangalore, Karnataka, India',
    mode: 'Remote | Full-time',
    routine: 'SQA, Scrum Meetings, PR reviews, Debugging, Test Automation',
    highlights: [
      'Joined as a SDET for a SaaS project called as PVAI (Pharmacovigilance Artificial Intelligence) that served pharma giants across Europe and UK.',
      'Extended the test automation framework by code refactoring and adding new features.',
      'Leveraged Selenium WebDriver & REST-Assured for test automation, increasing coverage by 40%.',
    ],
    stack: 'Java, SpringBoot, React, Redis, AWS, Selenium Webdriver, REST-Assured',
    awards: [
      {
        title: 'PVAI Spot Award',
        description:
          'Acknowledged by the VP (Quality Engineering) for swift onboarding and rapid adaptation and valuable contribution to the team dynamics during a critical phase of the ongoing project.',
      },
      {
        title: 'PVAI Enabler of Excellence',
        description:
          'Received award for rapidly mentoring colleagues in Test Automation, preparing them efficiently for real assignments.',
      },
    ],
  },
  {
    role: 'Assistant Systems Engineer (Automation QA)',
    org: 'Tata Consultancy Services Pvt Ltd.',
    duration: 'Jul/2019 - Mar/2021',
    location: 'Nagpur, Maharashtra, India',
    mode: 'Onsite and then Remote (due to COVID) | Full-time',
    routine: 'SQA, Scrum Meetings, Test Automation',
    highlights: [
      'Joined as a junior SDET to the QA team of TCS BaNCS (a software suite developed by TCS to serve leading banks across the globe).',
      'Learned to write efficient test cases and automated them enhancing overall test coverage.',
      'Solely designed and setup the core test automation framework for the QA team to carry the work forward.',
      'Implemented CI/CD for the test-scripts to run on AWS EC2 containers.',
      'Introduced healthy practices as a software engineer for fellow members to follow. Maintained proper documentation also.',
      'Occasionally led scrum meetings and experienced all the phases of Agile software development, especially the QA signoff.',
    ],
    stack:
      'Software Quality Assurance, Java, Selenium Webdriver, REST-Assured, Docker, Jenkins, AWS',
  },
];

export const skillGroups: SkillGroup[] = [
  { category: 'Programming', items: ['Java', 'Python'] },
  { category: 'Backend', items: ['Spring Boot', 'Django', 'NodeJS'] },
  { category: 'Frontend', items: ['HTML', 'JavaScript', 'React'] },
  { category: 'CI/CD', items: ['Jenkins', 'Github Actions', 'Docker'] },
  {
    category: 'Testing',
    items: [
      'Postman',
      'TestNG',
      'Selenium Webdriver',
      'Selenide',
      'WebdriverIO',
      'Playwright',
      'REST-Assured',
    ],
  },
  { category: 'Databases', items: ['MySQL'] },
  { category: 'Version Control', items: ['Git'] },
  {
    category: 'Tools/Cloud',
    items: ['Apache Maven', 'Poetry', 'MS Azure DevOps', 'AWS (not an expert)'],
  },
];

export const misc: { label: string; value: string }[] = [
  { label: 'Languages', value: 'English (Business-fluent), Hindi (Mother-tongue)' },
  { label: 'Marital Status', value: 'Single' },
  { label: 'Current Location', value: 'Pune, Maharashtra, India' },
];

export const activities: ActivityEntry[] = [
  {
    title: 'Smart India Hackathon',
    year: '2017',
    points: [
      'First nationwide hackathon organised by Govt of India.',
      'Our head of department (during my bachelors) selected me and one friend of mine from the entire class to join a team of 3 seniors for this hackathon.',
      "Our team made a Django project titled 'Petrol Pump Locator' which could be used by people to locate nearby petrol pumps around their location.",
      'Me and my friend worked on the frontend part of the project while others worked on the backend. But we did tinker around with Django’s configuration.',
      'Honestly, it was a thrilling experience where interest for application programming grew for me.',
      'Having said that, it was a bit overwhelming too, since we were not that good at coding at that point of time, but we did get alot of exposure.',
    ],
  },
  {
    title: 'Code Club Member, SSEC',
    year: '2019',
    points: [
      'SSEC is short for my college - Shri Shankaracharya Engineering College, Bhilai.',
      'I got my hands dirty on C/C++ mentorship being a final year student in my college. Helped juniors in campus placement as well.',
    ],
  },
];

export const hobbies = 'Cooking, Cleaning, Travelling.';
```

- [ ] **Step 2: Create `src/components/Timeline.astro`**

The `before:` pseudo-element draws the vertical rail; `TimelineItem` places its dot at `left-0` with an 11px diameter, so the rail sits at `left-[5px]` to align with the dot's centre.

```astro
---
interface Props {
  class?: string;
}

const { class: className = '' } = Astro.props;
---

<ol
  class:list={[
    'relative space-y-8 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-edge',
    className,
  ]}
>
  <slot />
</ol>
```

- [ ] **Step 3: Create `src/components/TimelineItem.astro`**

```astro
---
interface Props {
  role: string;
  org: string;
  duration: string;
  location: string;
  mode: string;
}

const { role, org, duration, location, mode } = Astro.props;
---

<li class="relative pl-8">
  <span
    class="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-accent bg-surface"
    aria-hidden="true"></span>

  <h3 class="font-mono text-base font-semibold text-content leading-snug">{role}</h3>
  <p class="font-mono text-sm text-accent mt-0.5">{org}</p>
  <p class="font-mono text-xs text-content-muted mt-1">
    {duration} <span aria-hidden="true">·</span> {location} <span aria-hidden="true">·</span> {mode}
  </p>

  <div class="mt-3 text-sm text-content-muted">
    <slot />
  </div>
</li>
```

- [ ] **Step 4: Create `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PromptLabel from '../components/PromptLabel.astro';
import Card from '../components/Card.astro';
import Badge from '../components/Badge.astro';
import Timeline from '../components/Timeline.astro';
import TimelineItem from '../components/TimelineItem.astro';
import {
  summary,
  education,
  experience,
  skillGroups,
  misc,
  activities,
  hobbies,
} from '../data/about';
---

<BaseLayout
  title="About Me"
  description="Learn more about Sambhav Dave - Software Engineer and SDET with 5+ years of experience"
>
  <header class="mb-10">
    <PromptLabel command="whoami" as="h1" />
    <p class="mt-4 text-content-muted leading-relaxed">{summary}</p>
  </header>

  <section class="mb-12 reveal">
    <PromptLabel command="experience" class="mb-6" />
    <Timeline>
      {
        experience.map((job) => (
          <TimelineItem
            role={job.role}
            org={job.org}
            duration={job.duration}
            location={job.location}
            mode={job.mode}
          >
            <p class="mb-2">
              <span class="font-mono text-xs text-content">Daily routine:</span> {job.routine}
            </p>
            <ul class="list-disc pl-5 space-y-1">
              {job.highlights.map((point) => (
                <li>{point}</li>
              ))}
            </ul>
            <p class="mt-3 flex flex-wrap items-center gap-1.5">
              <span class="font-mono text-xs text-content-muted mr-1">stack:</span>
              {job.stack.split(', ').map((tech) => (
                <Badge>{tech}</Badge>
              ))}
            </p>
            {job.awards && (
              <div class="mt-4 space-y-2 border-l-2 border-accent-muted pl-3">
                {job.awards.map((award) => (
                  <p>
                    <span class="font-mono text-xs text-accent">{award.title}</span>
                    <span class="block mt-0.5">{award.description}</span>
                  </p>
                ))}
              </div>
            )}
          </TimelineItem>
        ))
      }
    </Timeline>
  </section>

  <section class="mb-12 reveal">
    <PromptLabel command="education" class="mb-6" />
    <div class="grid gap-4 sm:grid-cols-2">
      {
        education.map((entry) => (
          <Card class="flex flex-col">
            <p class="font-mono text-xs text-accent">{entry.period}</p>
            <h3 class="font-mono text-base font-semibold mt-1 leading-snug">{entry.university}</h3>
            <p class="text-sm text-content-muted mt-2">{entry.degree}</p>
            <p class="font-mono text-xs text-content-muted mt-2">{entry.location}</p>
            <p class="font-mono text-xs text-content-muted mt-1">Grade: {entry.grade}</p>
          </Card>
        ))
      }
    </div>
  </section>

  <section class="mb-12 reveal">
    <PromptLabel command="skills --list" class="mb-6" />
    <dl class="space-y-4">
      {
        skillGroups.map((group) => (
          <div class="sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt class="font-mono text-sm text-content-muted mb-2 sm:mb-0">{group.category}</dt>
            <dd class="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <Badge>{item}</Badge>
              ))}
            </dd>
          </div>
        ))
      }
    </dl>
  </section>

  <section class="mb-12 reveal">
    <PromptLabel command="cat extras.txt" class="mb-6" />

    <dl class="font-mono text-sm space-y-2 mb-8">
      {
        misc.map((item) => (
          <div class="flex flex-wrap gap-x-2">
            <dt class="text-content-muted">{item.label}:</dt>
            <dd>{item.value}</dd>
          </div>
        ))
      }
      <div class="flex flex-wrap gap-x-2">
        <dt class="text-content-muted">Hobbies:</dt>
        <dd>{hobbies}</dd>
      </div>
    </dl>

    <h3 class="font-mono text-sm text-content-muted mb-4">Volunteering &amp; extracurriculars</h3>
    <div class="space-y-4">
      {
        activities.map((activity) => (
          <Card interactive={false}>
            <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <h4 class="font-mono text-base font-semibold">{activity.title}</h4>
              <span class="font-mono text-xs text-accent">{activity.year}</span>
            </div>
            <ul class="list-disc pl-5 space-y-1 text-sm text-content-muted">
              {activity.points.map((point) => (
                <li>{point}</li>
              ))}
            </ul>
          </Card>
        ))
      }
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 5: Delete the old markdown About page**

```bash
git rm src/pages/about.md
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: exits 0, and the build output lists `/about/index.html` (generated from the new `.astro` page).

- [ ] **Step 7: Visual check of About**

Navigate to `http://localhost:4321/about` and screenshot the full page.
Confirm:
- Heading is `$ whoami` with the summary paragraph in sans (not mono).
- Experience renders as a vertical rail with amber ring dots, one per job, six jobs total, newest (SeekOut) first.
- The dots line up on the rail — no horizontal offset.
- Each job shows role / org (amber) / a mono meta line / bullets / amber stack chips.
- The Genpact entry shows its two awards in an indented block.
- Education is two side-by-side cards.
- Skills render as label + chip rows for all eight categories.
- The extras section shows Languages / Marital Status / Current Location / Hobbies, then two activity cards.

Resize to `375 x 812` and confirm the education grid and skill rows stack.

Toggle light mode and screenshot.

- [ ] **Step 8: Commit**

```bash
git add src/data/about.ts src/components/Timeline.astro src/components/TimelineItem.astro src/pages/about.astro
git commit -m "feat(design): restructure About into timeline, cards, and skill chips"
```

---

## Task 7: Prose layouts and code blocks

**Files:**
- Create: `src/styles/prose.ts`
- Modify: `src/layouts/MarkdownLayout.astro`
- Modify: `src/layouts/BlogPostLayout.astro`

**Interfaces:**
- Consumes: Tailwind semantic colors from Task 1, dual-theme Shiki config from Task 1 Step 3, `BlogPostMeta.astro` from Task 4.
- Produces: `src/styles/prose.ts` exports `proseClasses: string`.

- [ ] **Step 1: Create `src/styles/prose.ts`**

```ts
/**
 * Shared Tailwind Typography configuration for all long-form content.
 *
 * Body copy stays in the sans stack for readability; headings and inline
 * code switch to mono so prose matches the rest of the design system.
 * Code block colors come from Shiki's dual-theme output — see the
 * `.astro-code` rules in global.css.
 */
export const proseClasses = [
  'prose prose-neutral dark:prose-invert max-w-none',
  'prose-headings:font-mono prose-headings:text-content prose-headings:tracking-tight',
  // Body copy stays at full contrast — muted is for metadata, not for
  // paragraphs someone has to read for several minutes.
  'prose-p:text-content prose-li:text-content',
  'prose-strong:text-content',
  'prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
  'prose-code:font-mono prose-code:text-accent prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:rounded-md prose-pre:border prose-pre:border-edge',
  'prose-blockquote:border-l-accent prose-blockquote:text-content-muted',
  'prose-hr:border-edge',
  'prose-img:rounded-md',
].join(' ');
```

- [ ] **Step 2: Rewrite `src/layouts/MarkdownLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import PromptLabel from '../components/PromptLabel.astro';
import { proseClasses } from '../styles/prose';

interface Props {
  frontmatter: {
    title: string;
    description?: string;
  };
}

const { frontmatter } = Astro.props;
---

<BaseLayout title={frontmatter.title} description={frontmatter.description}>
  <header class="mb-8">
    <PromptLabel command={frontmatter.title} as="h1" />
  </header>
  <article class={proseClasses}>
    <slot />
  </article>
</BaseLayout>
```

Note: the `<h1>{frontmatter.title}</h1>` that used to live *inside* the prose block is replaced by the `PromptLabel` header above it, so the title is no longer duplicated.

- [ ] **Step 3: Rewrite `src/layouts/BlogPostLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import BlogPostMeta from '../components/BlogPostMeta.astro';
import { proseClasses } from '../styles/prose';

interface Props {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  image?: string;
  imageAlt?: string;
}

const { title, description, pubDate, updatedDate, tags, image, imageAlt } = Astro.props;
---

<BaseLayout title={title} description={description}>
  <article>
    <header class="mb-8 pb-6 border-b border-edge">
      <h1 class="font-mono text-2xl sm:text-3xl font-bold tracking-tight mb-4 leading-tight">
        {title}
      </h1>
      <BlogPostMeta pubDate={pubDate} tags={tags} />
      {
        updatedDate && (
          <p class="font-mono text-xs text-content-muted mt-2">
            Updated:{' '}
            {updatedDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })}
          </p>
        )
      }
    </header>

    {image && <img src={image} alt={imageAlt || ''} class="rounded-md mb-8 w-full" />}

    <div class={proseClasses}>
      <slot />
    </div>

    <footer class="mt-12 pt-6 border-t border-edge">
      <a
        href="/blog"
        class="font-mono text-sm text-accent hover:text-accent-hover transition-colors"
      >
        &larr; back to blog
      </a>
    </footer>
  </article>
</BaseLayout>
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Visual check of prose pages**

Navigate to `http://localhost:4321/blog/playwright-tricks-and-tips` and screenshot.
Confirm: the post title is mono; body paragraphs are sans (Inter), not mono; headings inside the article are mono; links are amber; inline code is amber and mono with no backtick-quote characters around it; code blocks have a visible background distinct from the page background plus a border.

Toggle to light mode and screenshot the same post. **Confirm the code block switches to a light Shiki theme** — this is the dual-theme config from Task 1 working. If the code block stays dark in light mode, the `.astro-code` rules in `global.css` or the `defaultColor: false` setting are wrong.

Navigate to `/open-source` and confirm the title renders once as `$ Open-Source Contributions` (not duplicated) and the body prose is styled.

- [ ] **Step 6: Commit**

```bash
git add src/styles/prose.ts src/layouts/MarkdownLayout.astro src/layouts/BlogPostLayout.astro
git commit -m "feat(design): retheme prose layouts and dual-theme code blocks"
```

---

## Task 8: 404 page and motion audit

**Files:**
- Modify: `src/pages/404.astro`

**Interfaces:**
- Consumes: everything from Tasks 1-7. Produces nothing.

- [ ] **Step 1: Rewrite `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Page Not Found">
  <section class="flex flex-col items-start py-20 font-mono">
    <p class="text-6xl font-bold text-accent mb-6">404</p>
    <p class="text-content-muted text-sm">
      <span class="text-accent select-none" aria-hidden="true">$&nbsp;</span>command not found: {
        Astro.url.pathname
      }
    </p>
    <a href="/" class="text-sm text-accent hover:text-accent-hover transition-colors mt-8">
      &larr; cd ~
    </a>
  </section>
</BaseLayout>
```

Note: on a static build `Astro.url.pathname` for the 404 page resolves to `/404`, which is accurate — the visitor did reach the 404 route.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Visual check of 404**

Navigate to `http://localhost:4321/this-page-does-not-exist` and screenshot.
Confirm: large amber `404`, a `$ command not found: ...` line, and a `← cd ~` link.

- [ ] **Step 4: Verify reduced-motion support**

Run `browser_evaluate` with:

```js
() => window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

Then use `browser_run_code_unsafe` to emulate reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`), navigate to `/`, and take two screenshots ~1 second apart.
Expected: the cursor and status dot are static (identical between the two screenshots), and all content is visible — nothing stuck at `opacity: 0`.

Reset with `page.emulateMedia({ reducedMotion: 'no-preference' })`.

- [ ] **Step 5: Verify reveal animation degrades safely**

Run `browser_evaluate` with:

```js
() => {
  document.documentElement.classList.remove('js');
  return getComputedStyle(document.querySelector('.reveal')).opacity;
}
```

Expected: `"1"`. This confirms that without the `js` class, revealed sections are fully visible rather than invisible.

- [ ] **Step 6: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat(design): terminal-styled 404 page"
```

---

## Task 9: Style reference doc and full-site verification

**Files:**
- Create: `docs/DESIGN.md`

**Interfaces:**
- Consumes: the finished system. Produces the durable reference.

- [ ] **Step 1: Create `docs/DESIGN.md`**

````markdown
# Design System

The portfolio uses a dark-first, terminal-inspired visual language. This file is
the reference for extending it — read it before adding a page or component so
you are applying the existing system instead of inventing a new one.

## Colors

Tokens are CSS custom properties defined in `src/styles/global.css` and exposed
to Tailwind as semantic names in `tailwind.config.mjs`. **Always use the Tailwind
semantic class, never a raw hex or `var(--x)` arbitrary value.**

| Tailwind class | Token | Dark | Light | Use for |
|---|---|---|---|---|
| `bg-surface` | `--bg-primary` | `#0a0a0a` | `#fafaf9` | Page background |
| `bg-surface-raised` | `--bg-secondary` | `#141414` | `#f1f0ee` | Cards, hover backgrounds |
| `text-content` | `--text-primary` | `#e5e5e0` | `#171717` | Headings, body text |
| `text-content-muted` | `--text-secondary` | `#8a8a85` | `#5c5c57` | Descriptions, metadata |
| `border-edge` | `--border` | `#262622` | `#e0ded8` | Card borders, dividers |
| `text-accent` | `--accent` | `#f5a623` | `#a15c00` | Links, active nav, emphasis |
| `text-accent-hover` | `--accent-hover` | `#ffc05c` | `#7a4600` | Link hover |
| `bg-accent-muted` | `--accent-muted` | amber @ 12% | amber @ 10% | Badge/chip backgrounds |
| `bg-accent-green` | `--accent-secondary` | `#4ade80` | `#16a34a` | **Availability status dot only** |

**Rules:**

- Amber is the only general-purpose accent. Green is reserved for the
  availability dot on the home page — do not use it anywhere else.
- Every color pair above meets WCAG AA (≥4.5:1 for text, ≥3:1 for the
  non-text status dot). If you change a hex value, re-check contrast.
- Tailwind **opacity modifiers do not work** on these colors
  (`text-accent/50` will not render) because the values are `var()`-backed.
  Use the `accent-muted` token when you need a faded amber.

## Typography

Both fonts are loaded from Google Fonts in `src/layouts/BaseLayout.astro`.

| Role | Font | Class |
|---|---|---|
| Body copy, prose paragraphs | Inter | `font-sans` (inherited from `<body>`) |
| Headings, nav, labels, metadata, tags, code | JetBrains Mono | `font-mono` |

Size scale (stock Tailwind — do not introduce custom sizes):

| Element | Class |
|---|---|
| Page title | `text-2xl sm:text-3xl` |
| Section heading | `text-xl sm:text-2xl` |
| Card title | `text-base` or `text-lg` |
| Body | `text-sm` in cards, base in prose |
| Metadata, chips | `text-xs` |

**Rule:** long-form reading content stays sans. Mono is for chrome, labels, and
anything that should read as "machine output."

## Spacing and shape

- Stock Tailwind spacing scale.
- **Radius is always `rounded-md`** for cards, buttons, chips, and images.
  Never `rounded-full` or `rounded-lg`.
- Page container is `max-w-3xl mx-auto px-4` (set once in `BaseLayout`).
- Card grids: `grid gap-4 sm:grid-cols-2`. Stacked lists: `space-y-4`.

## Motion

Four effects, all defined in `global.css`, all disabled under
`prefers-reduced-motion: reduce`:

| Effect | How to use |
|---|---|
| Card hover lift | Automatic via `Card.astro` (`interactive` prop, default `true`) |
| Scroll entrance | Add `class="reveal"` to a section; the observer in `BaseLayout` handles the rest |
| Blinking cursor | Add `class="cursor-blink"` to a text element |
| Pulsing dot | Add `class="status-pulse"` to the dot span |

Do not add page transitions, parallax, or an animation library.

## Components

| Component | Props | Use when |
|---|---|---|
| `Card.astro` | `as`, `interactive`, `class` | Any bordered content block. Set `interactive={false}` for non-clickable cards. |
| `Badge.astro` | `href`, `class` | Skill tags, blog tags, any short chip. Renders `<a>` if `href` is given. |
| `PromptLabel.astro` | `command`, `as`, `class` | Every page title and major section heading. Renders `$ <command>`. |
| `Icon.astro` | `name`, `class` | Any inline SVG. Add new paths to `src/data/icons.ts`. |
| `Timeline.astro` + `TimelineItem.astro` | see props in file | Chronological entries (currently About → experience). |
| `SocialLinks.astro` | `class` | The social icon row. Driven by `siteConfig.social`. |
| `BlogPostCard.astro` / `ProjectCard.astro` | `post` / `project` | List items on blog and project pages. |
| `BlogPostMeta.astro` | `pubDate`, `tags` | Date + tag row on post cards and post headers. |

## Cheat sheet — adding things

**A new project:** add an entry to `src/data/projects.ts`. Styling is automatic
via `ProjectCard` → `Card` + `Badge`. No CSS needed.

**A new blog post:** create a file in `src/content/blog/` (or use Keystatic at
`/keystatic` in dev). Frontmatter is validated by `src/content.config.ts`.
Styling comes from `BlogPostLayout` + `proseClasses`. No CSS needed.

**A new About entry (job, degree, skill, activity):** add it to
`src/data/about.ts`. The page renders from that data.

**A new page:** wrap it in `BaseLayout`, open with a `PromptLabel as="h1"`, and
add `class="reveal"` to major sections. Compose from `Card` / `Badge` rather
than writing new container styles. Add the route to `siteConfig.nav` if it
belongs in the header.

**A new icon:** add the 24x24 path to `src/data/icons.ts`, then use
`<Icon name="..." />`.

**A new color:** don't, unless a genuinely new role exists. If it does, add it
as a CSS custom property in **both** `:root` and `.dark`, map it in
`tailwind.config.mjs`, check its contrast, and document it in the table above.

## Verification

There is no automated visual regression suite. After a visual change:

1. `npm run build` — must exit 0.
2. `npm run dev`, then check the affected pages in **both** themes and at
   mobile width (375px).
3. If you touched a color, re-check contrast against the table above.
````

- [ ] **Step 2: Full-site verification sweep**

Build first — `npm run build` must exit 0.

Then, with the dev server running, walk every route in **both** themes and screenshot each:

| Route | Check |
|---|---|
| `/` | Hero, amber name, green pulsing dot, blinking cursor, recent posts |
| `/about` | Timeline dots aligned, education cards, skill chips, extras |
| `/projects` | Two-column card grid, chips, icon buttons |
| `/blog` | Post cards, mono dates, tag chips |
| `/blog/playwright-tricks-and-tips` | Sans body, mono headings, themed code block |
| `/blog/tag/playwright` | Tag heading, cards, back link |
| `/open-source` | Prose styling, single title |
| `/nope` | 404 terminal copy |

Then resize to `375 x 812` and re-walk `/`, `/about`, `/projects`, `/blog`.

Confirm across all of the above:
- No leftover indigo/violet anywhere.
- No `rounded-full` on cards/chips/buttons (the only round things should be the status dot and timeline dots).
- Green appears **only** as the home page availability dot.
- Nothing is invisible or clipped, in either theme.

Fix any issue found before committing.

- [ ] **Step 3: Confirm no stale token usage remains**

Run:

```bash
grep -rn "var(--" src --include=*.astro
```

Expected: **no matches.** Every component should now use semantic Tailwind classes. (`src/styles/global.css` and `src/styles/prose.ts` are excluded by the `--include` filter and legitimately still reference the properties.)

Also run:

```bash
grep -rn "indigo\|slate\|rounded-full\|rounded-lg" src --include=*.astro
```

Expected: no matches except `rounded-full` on the status dot in `src/pages/index.astro` and the timeline dot in `src/components/TimelineItem.astro`.

Fix anything else that turns up.

- [ ] **Step 4: Commit**

```bash
git add docs/DESIGN.md
git commit -m "docs: add design system reference"
```

---

## Definition of Done

- [ ] `npm run build` exits 0.
- [ ] All eight routes verified in dark and light mode, plus mobile width.
- [ ] `grep -rn "var(--" src --include=*.astro` returns nothing.
- [ ] Green appears only as the home page availability dot.
- [ ] Reduced-motion is honoured; content is visible with JS disabled.
- [ ] `docs/DESIGN.md` exists and matches what was actually built.
- [ ] `src/pages/about.md` is deleted and `/about` renders from `about.astro`.
