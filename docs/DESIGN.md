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
  The only `rounded-full` elements in the whole site are the home page
  availability dot (`src/pages/index.astro`) and the timeline dot
  (`src/components/TimelineItem.astro`) — both are small circular indicators,
  not cards or controls. Do not add a third.
- Page container is `max-w-3xl mx-auto px-4` (set once in `BaseLayout`).
- Card grids: `grid gap-4 sm:grid-cols-2`. Stacked lists: `space-y-4`.

## Motion

Four effects, all defined in `global.css`, all disabled under
`prefers-reduced-motion: reduce`:

| Effect | How to use |
|---|---|
| Card hover lift | Automatic via `Card.astro` (`interactive` prop, default `true`) |
| Scroll entrance | Add `class="reveal"` to a section; the observer in `BaseLayout` handles the rest |
| Blinking cursor | Add a dedicated element with `class="cursor-blink"`, e.g. `<span class="cursor-blink text-accent ml-0.5" aria-hidden="true">▋</span>` |
| Pulsing dot | Add `class="status-pulse"` to the dot span |

> **Note on the blinking cursor:** an earlier version of this system injected
> the `▋` glyph via a `.cursor-blink::after` pseudo-element. That approach was
> removed because pseudo-element content cannot be given `aria-hidden`, so
> screen readers announced the glyph as part of the tagline text. `.cursor-blink`
> in `global.css` is now a bare animation utility (it only supplies the
> blinking `opacity` keyframes) — the glyph must be its own real element,
> marked `aria-hidden="true"`, as shown above and used in `src/pages/index.astro`.

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

`Header.astro`, `Footer.astro`, and `ThemeToggle.astro` are site chrome
composed once inside `BaseLayout` — new pages get them for free and should not
reimplement or duplicate them.

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

## Known limitations

- **404 page path display.** `src/pages/404.astro` renders `Astro.url.pathname`
  to echo back the "command not found" path. On this static (`output: 'static'`)
  build, that value is baked in at build time as `/404/` rather than reflecting
  the visitor's actual mistyped URL, because there is no per-request server to
  read the real request path from. This was found in review and the decision
  was to leave it as-is rather than add server-side rendering for a cosmetic
  detail — see the comment above that line in `404.astro`.

## Verification

There is no automated visual regression suite. After a visual change:

1. `npm run build` — must exit 0.
2. `npm run dev`, then check the affected pages in **both** themes and at
   mobile width (375px).
3. If you touched a color, re-check contrast against the table above.
