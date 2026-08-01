# Portfolio UI/UX Redesign — Design Spec

Date: 2026-08-01
Status: Approved (design phase) — pending implementation plan

## Goal

Complete visual/UX redesign of the Astro portfolio, executed as a single weekend
project, structured so that future additions (new blog posts, new projects, new
pages) reuse an established system instead of requiring fresh design decisions.

## Direction

**Theme:** Dev-tool / technical — terminal-inspired, dark-first, signals
"engineer" immediately. Applied through color and typographic accents rather
than a literal terminal-window UI (restrained execution, not a themed gimmick).

**Content scope:** All existing pages are restyled: Home, About, Projects,
Blog (list + post), Open Source, 404, Header, Footer. The About page is also
*restructured* (not just restyled) — see Page Treatment below. No new pages,
no content rewrites beyond what restructuring requires (headings/grouping),
no copy changes to job history / bios / project descriptions.

**Layout:** Keep the current narrow single-column layout (`max-w-3xl`,
centered). No shift to a wider/app-like or sidebar-nav layout.

**Visuals:** No new images/screenshots/illustrations. Projects and blog posts
remain text-first; visual richness comes from typography, color, tags, and
card treatment — not imagery.

**Motion:** Subtle polish only — hover lift on cards, a blinking cursor
accent, a pulsing availability status dot, and small scroll-entrance
fades. No page transitions, no parallax, no animation library.

## Implementation approach

**Token-driven design system** (chosen over a minimal in-place restyle or a
full living style-guide page): formalize design tokens, extract a handful of
shared primitive components, and document the system in one file
(`docs/DESIGN.md`). This is the approach that directly serves the "don't
have to rethink FE again" goal — new content reuses existing primitives
rather than prompting new styling decisions.

## Design tokens

CSS custom properties in `src/styles/global.css`, dark mode is default (as
today), light mode via `.dark` class toggle removal (existing mechanism
unchanged).

| Token | Dark (default) | Light | Usage |
|---|---|---|---|
| `--bg-primary` | `#0a0a0a` | `#fafaf9` | page background |
| `--bg-secondary` | `#141414` | `#f1f0ee` | cards, tag chips, code blocks |
| `--text-primary` | `#e5e5e0` | `#171717` | headings, body |
| `--text-secondary` | `#8a8a85` | `#5c5c57` | meta text, descriptions |
| `--border` | `#262622` | `#e0ded8` | dividers, card borders |
| `--accent` (amber, primary) | `#f5a623` | `#b8720a` | links, active nav, primary emphasis, cursor |
| `--accent-secondary` (green) | `#4ade80` | `#16a34a` | availability status dot only — not general use |
| `--accent-muted` | amber @ ~12% opacity | amber @ ~10% opacity | tag/badge chip backgrounds |

Exact hex values may be adjusted slightly during implementation for contrast
compliance (see Verification), but the role assignments and the
amber-primary/green-reserved-for-status relationship are fixed.

**Typography:**
- Sans (Inter): body copy, prose paragraphs — kept for long-form readability.
- Mono (JetBrains Mono): headings, nav items, labels, metadata, tags, prose
  headings inside blog posts, code blocks.
- Type scale: reuse existing Tailwind scale (`text-sm` metadata → `text-base`
  body → `text-xl`/`text-2xl`/`text-4xl` for h3/h2/h1). No new scale.

**Spacing & radius:** Tailwind default spacing scale, unchanged. Card/button
radius moves from `rounded-full`/`rounded-lg` to `rounded-md` for a sharper,
more tool-like feel.

## Shared primitives

New or consolidated components under `src/components/`:

- **`Badge.astro`** — mono-font pill for skill tags (Projects) and post tags
  (Blog), amber-muted background. Replaces the duplicated ad hoc tag markup
  currently in `ProjectCard.astro` and blog tag rendering.
- **`PromptLabel.astro`** — small `$`/`>`-prefixed mono label used before
  section headings (e.g. `$ projects`, `$ recent-posts`) across Home,
  Projects, Blog.
- **`Card.astro`** — shared bordered container with hover-accent border and
  lift transition. `ProjectCard.astro` and `BlogPostCard.astro` both compose
  this instead of duplicating border/hover classes.
- **`Timeline.astro`** + **`TimelineItem.astro`** — new, used by the
  restructured About page experience section.
- **Status dot** — small inline element (not a standalone component file),
  green pulsing dot + "Available for opportunities" text, used once in the
  Home hero.
- **Blinking cursor** — small CSS-animated `▋` character used in the Home
  hero tagline area.

Existing components kept structurally as-is, re-themed only: `Header.astro`,
`Footer.astro`, `ThemeToggle.astro`, `SocialLinks.astro`, `BlogPostMeta.astro`.

## Page treatment

- **Header/Nav** — same structure (logo left, nav + theme toggle right).
  Nav items render in mono; active item gets an amber underline (not just
  amber text). Logo/site title renders as mono-styled text
  (`sambhav@portfolio:~$`) instead of plain bold sans text.
- **Home** — avatar, name (mono, partial amber accent), tagline (sans),
  status dot + availability text, blinking cursor. Recent Posts section
  gets a `$ recent-posts` `PromptLabel`. No terminal-window chrome, no
  typing animation — restrained per the "simple hero, themed details" choice.
- **About** — restructured, content unchanged:
  - Summary: intro paragraph, sans prose.
  - Experience: `Timeline`/`TimelineItem` — role/org/dates/location as a
    mono metadata row per item, description as sans bullet list.
  - Education: two compact cards (reuse `Card`).
  - Technical Skills: `Badge` groups, categorized as currently listed
    (Programming, Backend, Frontend, CI/CD, Testing, Databases, Version
    Control, Tools/Cloud).
  - Misc info / Hobbies / Extracurricular: condensed into a compact closing
    section rather than full markdown sprawl.
- **Projects** — `ProjectCard` rebuilt on shared `Card`; skills render as
  `Badge` chips; GitHub/Video links become small icon+label buttons instead
  of plain underlined text links.
- **Blog list** — `BlogPostCard` rebuilt on shared `Card`; tags as `Badge`
  chips; date/tag metadata via `BlogPostMeta` in mono.
- **Blog post (`BlogPostLayout`/`MarkdownLayout`)** — prose stays sans for
  body copy; prose headings render in mono via `prose-headings` override;
  code blocks get contrast tuned for the new near-black background.
- **404** — same layout; "404" in mono/amber; copy changes to
  `command not found: /this-page` style terminal flavor, replacing
  "Page not found."
- **Open Source page / Footer** — re-themed only, no structural change.

## Motion

- Card hover: `translateY(-2px)` lift + border color shift to amber
  (on the shared `Card` primitive, so it applies everywhere automatically).
- Section entrance: small fade/slide-up on scroll for major sections (hero,
  project grid, post list) via CSS/IntersectionObserver — no animation
  library dependency added.
- Cursor blink: CSS `@keyframes` opacity blink (~1s interval) on the `▋`
  character.
- Status dot: subtle CSS pulse (scale/opacity).
- Existing theme-toggle color transition unchanged.
- Explicitly out of scope: page transitions, parallax, scroll-jacking,
  any JS animation library.

## Style reference doc

`docs/DESIGN.md` (separate from this spec, lives alongside the code as the
ongoing reference):
- Color token table (both modes).
- Type scale and which font each level uses.
- Spacing/radius conventions.
- List of shared primitives with a one-line "when to use" each.
- A short "when adding X, do Y" cheat sheet (e.g. "new project → add to
  `src/data/projects.ts`; card styling is automatic via `Card` + `Badge`").

## Verification

Manual, since this is a visual/UX change — no new automated tests are in
scope:
- Run the dev server; check every page (Home, About, Projects, Blog list,
  a blog post, Open Source, 404) in both dark and light mode.
- Check responsive behavior: mobile nav toggle, project/blog card grid
  collapse to single column.
- Spot-check color contrast for amber-on-near-black and amber-on-light
  text/link usage against WCAG AA guidance; adjust token hex values if
  needed (see Design Tokens note above).

## Out of scope

- New pages or navigation items.
- Content rewrites (job history, bios, project descriptions stay as-is
  apart from structural regrouping on About).
- Images/screenshots for projects or blog posts.
- Wider/app-like layout or persistent sidebar navigation.
- Full living style-guide page (`/design-system` route) — may be a future
  follow-up, not part of this weekend project.
- Automated visual regression tests.
