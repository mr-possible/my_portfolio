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
| `text-accent` | `--accent` | `#f5a623` | `#8a4f00` | Links, active nav, emphasis |
| `text-accent-hover` | `--accent-hover` | `#ffc05c` | `#6b3c00` | Link hover |
| `bg-accent-muted` | `--accent-muted` | amber @ 12% | amber @ 10% | Badge/chip backgrounds |
| `bg-accent-green` | `--accent-secondary` | `#4ade80` | `#16a34a` | **Availability status dot only** |

**Rules:**

- Amber is the only general-purpose accent. Green is reserved for the
  availability dot on the home page — do not use it anywhere else.
- Tailwind **opacity modifiers do not work** on these colors
  (`text-accent/50` will not render) because the values are `var()`-backed.
  Use the `accent-muted` token when you need a faded amber.

### Contrast

Every pair below is measured, not assumed. Light mode is the tighter of the
two themes; dark mode clears AA everywhere with a wide margin.

| Pairing | Light | Dark | Bar |
|---|---|---|---|
| `text-content` on `bg-surface` | 17.2:1 | 15.7:1 | 4.5:1 |
| `text-content-muted` on `bg-surface` | 6.4:1 | 5.7:1 | 4.5:1 |
| `text-accent` on `bg-surface` | 6.29:1 | 9.8:1 | 4.5:1 |
| `text-accent` on `bg-accent-muted`, over a card | **5.01:1** | 7.4:1 | 4.5:1 |
| `text-accent` on `bg-accent-muted`, over the page | **5.43:1** | 8.2:1 | 4.5:1 |
| `bg-accent-green` dot on `bg-surface` | 3.2:1 | 11.4:1 | 3:1 (non-text) |

The two bolded rows are the ones that bite. `bg-accent-muted` is a **translucent
overlay** (amber at 10–12%), so a chip's real background is the accent composited
over whatever sits behind it — and that composite is what has to clear 4.5:1, not
the token against the page background. Checking `--accent` against `bg-surface`
alone once passed while the actual chips shipped at 4.01:1 and failed AA.

**If you change `--accent` or `--accent-muted`, re-measure the two composite rows
in a browser** — compute the effective background yourself rather than reading
the token's hex.

## Typography

Both fonts are loaded from Google Fonts in `src/layouts/BaseLayout.astro`.

| Role | Font | Class |
|---|---|---|
| Body copy, prose paragraphs | Inter | `font-sans` (inherited from `<body>`) |
| Headings, nav, labels, metadata, tags, code | JetBrains Mono | `font-mono` |

Size scale (stock Tailwind — do not introduce custom sizes):

| Element | Class |
|---|---|
| Display (home hero `h1`, 404 code) | `text-3xl sm:text-4xl`, `text-6xl` |
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
- Page container is `flex-1 max-w-3xl mx-auto w-full px-4 py-12` (set once on
  `<main>` in `BaseLayout`). Pages never set their own width.
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

`.reveal` is also forced visible under `@media print` — without that, any
section below the fold never receives `is-visible` and prints blank. This
matters most on `/about`, which is a résumé people save as PDF.

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
| `PromptLabel.astro` | `command`, `as`, `class` | Section headings, and page titles that read as a command. Renders `$ <command>`. See the note below. |
| `Icon.astro` | `name`, `class` | Any inline SVG. Add new paths to `src/data/icons.ts`. |
| `Timeline.astro` + `TimelineItem.astro` | see props in file | Chronological entries (currently About → experience). |
| `SocialLinks.astro` | `class` | The social icon row. Driven by `siteConfig.social`. |
| `BlogPostCard.astro` / `ProjectCard.astro` | `post` / `project`, `as` | List items on blog and project pages. `as` sets the heading level (`'h2'` default, `'h3'`) — see the note below. |
| `BlogPostMeta.astro` | `pubDate`, `tags` | Date + tag row on post cards and post headers. |

`Header.astro`, `Footer.astro`, and `ThemeToggle.astro` are site chrome
composed once inside `BaseLayout` — new pages get them for free and should not
reimplement or duplicate them.

> **`PromptLabel` is not universal.** Three headings are deliberately raw
> `<h1>`s instead: the home hero (a name, not a command), a blog post title
> (`BlogPostLayout.astro`), and the 404 code. Use `PromptLabel` when the
> heading names an action or a listing — `$ ls ~/projects`, `$ whoami`,
> `$ cat ~/blog/*`. Use a raw mono `<h1>` when the heading is a proper noun or
> content title, where a `$` prefix would be nonsense.

> **Heading levels are a prop, not a constant.** The same card appears under
> different outlines: on `/projects` the cards sit directly under the page
> `h1`, so they are `h2`; on `/` they sit under an `h2` section label, so they
> are `h3`. Pass `as` to match the page, and check the resulting outline never
> skips a level — `document.querySelectorAll('h1,h2,h3,h4')` in the console is
> enough to confirm it.

## Cheat sheet — adding things

**A new project:** add an entry to `src/data/projects.ts`. Styling is automatic
via `ProjectCard` → `Card` + `Badge`. No CSS needed.

**A new blog post:** create a file in `src/content/blog/` (or use Keystatic at
`/keystatic` in dev). Frontmatter is validated by `src/content.config.ts`.
Styling comes from `BlogPostLayout` + `proseClasses`. No CSS needed.

**A new About entry (job, degree, skill, activity):** add it to
`src/data/about.ts`. The page renders from that data.

**A new page, mostly prose:** write it as markdown in `src/pages/` with
`layout: ../layouts/MarkdownLayout.astro` and a `title` in the frontmatter —
that layout already supplies the `PromptLabel` heading and `proseClasses`.
`src/pages/open-source.md` is the working example. Don't hand-roll this case.

**A new page, structured:** wrap it in `BaseLayout`, open with a
`PromptLabel as="h1"`, and add `class="reveal"` to major sections. Compose from
`Card` / `Badge` rather than writing new container styles. Add the route to
`siteConfig.nav` if it belongs in the header.

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
