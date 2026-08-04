# SEO Improvements — Design Spec

Date: 2026-08-04
Status: Implemented

## Goal

Make the portfolio legible to search engines and social scrapers. Two audiences,
in priority order:

1. **Name searches.** Someone who has been handed the name "Sambhav Dave" — a
   recruiter, a hiring manager — should land on this site rather than on a
   third-party profile. Requires entity signals (`Person` structured data,
   `sameAs` profile links), role keywords in titles, and link previews that
   render as something other than a text blob.
2. **Blog discovery.** Posts should be findable by topic ("playwright tricks",
   "testing methodologies"). Requires `BlogPosting` markup, real headings,
   article-typed OpenGraph, and non-duplicated metadata.

Both are served by one pass over the head/metadata layer, which is why they are
sequenced together rather than as separate projects.

## Audit findings

The state this spec is responding to, verified against both source and the
built output in `dist/`.

| # | Finding | Location | Severity |
|---|---|---|---|
| 1 | No `og:image` anywhere; `twitter:card` is `summary` | `BaseLayout.astro:42-51` | Critical |
| 2 | No structured data of any kind | — | Critical |
| 3 | No `robots.txt`; sitemap generated but never declared | `public/` | Critical |
| 4 | `og:type` hardcoded `website`, so blog posts misdeclare; no article dates | `BaseLayout.astro:45` | Critical |
| 5 | `h1` is a shell command on 5 page types | `PromptLabel` callers | High |
| 6 | Homepage `<title>` is the bare name, no role keywords | `BaseLayout.astro:13` | High |
| 7 | Tag pages pass no `description`, so ~9 pages share the site tagline | `blog/tag/[tag].astro:27` | High |
| 8 | Avatar is 1815×1699 / 1.2 MB, rendered at 112×112, on the homepage LCP path | `public/images/dp.jpg` | High (perf) |
| 9 | Google Fonts as render-blocking external stylesheet + 2 preconnects | `BaseLayout.astro:35-40` | Medium (perf) |
| 10 | Blog hero `<img>` has no `width`/`height` → layout shift | `BlogPostLayout.astro:40` | Medium (perf) |

Finding 5, in the built output:

```
/about                → <h1>$ whoami</h1>
/projects             → <h1>$ ls ~/projects</h1>
/blog                 → <h1>$ cat ~/blog/*</h1>
/blog/tag/playwright  → <h1>$ grep -r "#playwright"</h1>
/open-source          → <h1>$ Open-Source Contributions</h1>
```

The strongest on-page signal on five page types carries no keyword content.
This is also an accessibility defect: a screen reader announces the About page
heading as "dollar sign whoami."

## Decisions taken

Three choices were resolved during design and are settled — implementation
should not revisit them.

**H1 strategy: screen-reader-only real heading.** The terminal prompts stay
pixel-identical. `PromptLabel` demotes to a non-heading element and a
`sr-only` `h1` carries the real text. Rejected: a visible `h1` above each
prompt (trades the site's design identity for a marginal gain over sr-only),
and smuggling keywords into the commands themselves (too little keyword room,
and no natural phrasing for `/blog`).

An `sr-only` `h1` whose text matches the page's actual subject is standard
accessibility practice, not cloaking. The heading text below is descriptive of
real page content in every case.

**OG images: one static default plus per-post override.** A single branded
1200×630 card sitewide; posts that set `image` in frontmatter use theirs. The
`image` / `imageAlt` fields already exist in the collection schema
(`content.config.ts:14-15`) and are currently only used for the in-page hero.
Rejected: build-time generated per-post cards (`astro-og-canvas`) — real CTR
value but not at three posts, and adopting it later requires no rework of this
design.

*Caveat on that rejection.* Part of the case for static-only was "no new
dependency." That turned out to be wrong: rendering a branded card at all needs
`@resvg/resvg-js` (see OG default image below), which is the same renderer
`astro-og-canvas` wraps. So the marginal cost of per-post cards is smaller than
assumed — it is now build time and template work, not a new dependency class.
The decision stands on the remaining grounds (three posts; no rework needed to
adopt later), but this is the thing to re-weigh when the post count grows.

**Priority: name first, then blog.** Reflected in phase ordering only; all
phases are in scope.

## Architecture

### Metadata layer

`BaseLayout.astro` replaces its two-prop signature with an explicit contract:

```ts
interface Props {
  title?: string;
  description?: string;
  heading?: string;                    // sr-only h1 text; omit if page has a visible h1
  ogType?: 'website' | 'article';      // default 'website'
  ogImage?: string;                    // default '/og-default.png'
  publishedTime?: Date;
  modifiedTime?: Date;
  noindex?: boolean;
  schema?: object | object[];          // JSON-LD, see below
}
```

Behaviour:

- `og:image` always emitted, absolutized against `Astro.site`, with
  `og:image:width`, `og:image:height`, `og:image:alt`.
- `twitter:card` becomes `summary_large_image`. Both `twitter:creator` and
  `twitter:site` are set to the same handle, derived by parsing it out of the
  Twitter entry in `siteConfig.social` (`@DaveSambhav`) rather than hardcoding
  it. On a personal site the site and the creator are the same account; setting
  both is intentional, not a copy-paste error.
- `article:published_time` and `article:modified_time` emitted **only** when
  `ogType === 'article'`, formatted as ISO 8601.
- `noindex` emits `<meta name="robots" content="noindex, nofollow">`. Used by
  the 404 page.

`BlogPostLayout.astro` passes `ogType="article"` plus the `pubDate` /
`updatedDate` / `image` it already receives as props. No new data plumbing.

### Structured data

New `src/utils/schema.ts`. Pure functions returning plain objects — no Astro
imports, no rendering concerns — so the JSON-LD shape can be read and changed
without touching templates, and so each function can be reasoned about alone.

| Function | Emits | Used on |
|---|---|---|
| `personSchema()` | `Person`: name, jobTitle, url, image, `sameAs[]` | home, about |
| `websiteSchema()` | `WebSite`: name, url, author ref | home |
| `blogPostingSchema(post, url)` | `BlogPosting`: headline, description, datePublished, dateModified, author, image, keywords | blog posts |
| `breadcrumbSchema(trail)` | `BreadcrumbList` from `[{name, url}]` | blog posts, tag pages |

`sameAs` is built from `siteConfig.social` rather than hardcoded — the five
profile URLs (GitHub, Twitter, LinkedIn, Medium, YouTube) already live in
`src/data/site.ts` and are the core of the name-search entity signal.

`BaseLayout` renders whatever `schema` it receives inside a single
`<script type="application/ld+json">`, array-wrapping when given multiple.

### Headings

`PromptLabel.astro` drops `'h1'` from its `as` union, so the type system
prevents regression. The five pages currently passing `as="h1"` stop doing so;
their prompt renders as a `<div>` with identical classes.

`BaseLayout` renders `<h1 class="sr-only">{heading}</h1>` as the first child of
`<main>` when `heading` is set. Centralizing it there — rather than in each
page — guarantees exactly one `h1` per document. Pages that already have a real
visible `h1` (home, blog posts, 404) omit `heading`.

| Page | `heading` | `title` |
|---|---|---|
| `/` | *(omitted — visible h1)* | `Sambhav Dave — Software Engineer & SDET` |
| `/about` | About Sambhav Dave | `About Sambhav Dave` |
| `/projects` | Projects by Sambhav Dave | *(unchanged)* |
| `/blog` | Blog — Testing, Automation & Software Engineering | *(unchanged)* |
| `/blog/tag/[tag]` | Posts tagged "\{tag\}" | *(unchanged)* |
| `/open-source` | *(frontmatter title)* | *(unchanged)* |
| `/blog/[slug]` | *(omitted — visible h1)* | *(unchanged)* |
| `/404` | *(omitted — visible h1)* | *(unchanged, + `noindex`)* |

Homepage `title` requires a change to how `BaseLayout` composes titles. Today
`pageTitle` is `title ? \`${title} | ${siteConfig.title}\` : siteConfig.title`,
so the untitled homepage gets the bare name. Add one field to `siteConfig`:

- `title: 'Sambhav Dave'` — unchanged, remains the suffix on subpages.
- `titleDefault: 'Sambhav Dave — Software Engineer & SDET'` — new, used only
  when no `title` prop is given.

So `pageTitle` becomes `title ? \`${title} | ${siteConfig.title}\` :
siteConfig.titleDefault`. Subpage titles are unaffected.

### Tag page descriptions

`blog/tag/[tag].astro` generates a description per tag rather than inheriting
the site tagline, e.g. `Posts about {tag} — testing, automation, and software
engineering notes by Sambhav Dave.` Resolves 9 duplicate meta descriptions.

### robots.txt

Static `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://www.sambhav.blog/sitemap-index.xml
```

### OG default image

New `scripts/make-og-image.mjs`, wired as `npm run og`, writing
`public/og-default.png` at 1200×630, on the dark theme: background `#0a0a0a`,
primary text `#e5e5e0`, accent `#f5a623`, border `#262622`.

Card contents, in the site's terminal idiom:

- The keyed SD mark from `assets/logo-portfolio.png`, reusing `make-favicon.mjs`'s
  luminance/saturation keying so it reads on the dark field.
- `siteConfig.author` — "Sambhav Dave" — as the primary line, JetBrains Mono,
  the first word in accent `#f5a623` to match the homepage `h1` treatment.
- `siteConfig.description` — "Software Engineer | SDET" — as the secondary line
  in `#8a8a85`. Pulled from config rather than duplicated as a string literal,
  so the card and the homepage cannot drift apart.
- An accent `$` prompt glyph before the name, matching `PromptLabel`.

**Text rendering.** JetBrains Mono is not installed as a system font on the
development machine (verified — `~/Library/Fonts` has Space Mono, not JetBrains
Mono). `sharp` renders SVG through librsvg, which resolves fonts via
fontconfig, so an SVG overlay naming `JetBrains Mono` would silently fall back
to some other monospace and the card would render off-brand — differently on
different machines.

So the script rasterizes text with `@resvg/resvg-js`, which accepts explicit
font file paths instead of consulting system fonts, pointed at the TTF shipped
inside `@fontsource-variable/jetbrains-mono`. Deterministic on any machine. The
resulting bitmap is composited onto the card with `sharp`.

This means Phase 1 introduces two devDependencies:
`@resvg/resvg-js` and `@fontsource-variable/jetbrains-mono`. The latter is the
same package Phase 4 uses to self-host the site's fonts, so the two phases
share it rather than each adding their own — Phase 4 promotes it from a
devDependency to a dependency.

For compositing and the mark keying it reuses the `sharp` pipeline that
`scripts/make-favicon.mjs` already establishes. Note that `sharp` resolves
transitively through Astro rather than appearing in `package.json` — this
follows the precedent `make-favicon.mjs` already set, and the new script
inherits that fragility rather than adding to it.

Both new devDependencies are build-tooling only: they are used by `npm run og`,
never by `astro build`. The output is committed, as the favicons are, so a clean
checkout can build the site without them.

## Phasing

Ordered so each phase leaves the site in a shippable state.

1. **Metadata layer** — `BaseLayout` props, og:image wiring, article meta,
   `robots.txt`, OG image script and its output. Fixes findings 1, 3, 4.
2. **Structured data** — `schema.ts` and its wiring. Fixes finding 2.
3. **On-page** — sr-only headings, `PromptLabel` change, titles, tag
   descriptions. Fixes findings 5, 6, 7.
4. **Core Web Vitals** — avatar downscale to a 224×224 WebP, self-hosted fonts
   via `@fontsource-variable` (replacing the Google Fonts link and both
   preconnects), `width`/`height` on the blog hero image. Fixes findings 8, 9,
   10.

Phase 4 is separable: it touches no metadata and can be dropped or deferred
without affecting phases 1-3.

## Verification

Per phase, against the built output in `dist/` — not against source, since the
findings above were only fully visible post-build:

- Exactly one `<h1>` per page, and its text is the intended heading. Check
  `/about`, `/projects`, `/blog`, a tag page, `/open-source`.
- `og:image`, `og:type`, `twitter:card` present and correct on a blog post vs.
  a static page; article dates present on the former and absent on the latter.
- JSON-LD parses as valid JSON and validates against Schema.org expectations
  for `Person` and `BlogPosting`.
- No two pages share a meta description.
- `robots.txt` served, sitemap URL resolves.
- Avatar payload under 20 KB; no Google Fonts request in the built HTML.

## Implementation notes

Where the built result diverged from the design above. Recorded because each
was forced by something the design assumed wrongly.

**Three devDependencies, not two.** The design expected `@resvg/resvg-js` plus
`@fontsource-variable/jetbrains-mono` to suffice, with Phase 4 sharing the
latter. Two discoveries changed that:

- resvg cannot decode woff2, and `@fontsource` ships nothing else — so
  `wawoff2` was added to decompress to TTF in memory.
- resvg pins a variable font to its default instance and silently ignores
  `font-weight` — rendering at 700 against the variable font is pixel-identical
  to 400. The *static* `@fontsource/jetbrains-mono` was added for a real bold on
  the card. The site itself still uses the variable package, which is smaller.

Also worth knowing: resvg's `fontBuffers` option is silently ignored. Passing
buffers renders in a fallback sans-serif with no error; only `fontFiles`
(paths) works, hence the temp-file step in `make-og-image.mjs`.

**`PromptLabel` gained `as="page"` rather than only losing `'h1'`.** Dropping
`h1` from the union left no way to ask for the largest type size. `as="page"`
provides it and renders a `<div>` — a visual size with no heading semantics.
Verified: computed font-size and margins are unchanged from the old `h1`, so
the swap is visually a no-op (Tailwind preflight already zeroed heading
margins).

**`og:image:width` / `height` are conditional.** Emitted only for the generated
default card, whose dimensions are known. A post supplying its own hero image
can be any shape, and declaring unmeasured dimensions is worse than declaring
none, since scrapers use them to reserve layout.

**`collectionPageSchema()` was added**, beyond the four builders specced. The
blog index and tag archives are lists of posts, not articles; `CollectionPage`
with a nested `ItemList` says so, where `BlogPosting` would have misdescribed
them.

**The avatar became a generated asset.** `public/images/dp.jpg` moved to
`assets/dp-source.jpg` and `npm run avatar` emits `public/images/dp.webp`,
matching the existing convention that `assets/` holds sources and `public/`
holds generated output. 1221 KB → 17 KB.

**Blog hero CLS is handled with `aspect-ratio`, not `width`/`height`.** The
frontmatter `image` is a plain path, so intrinsic dimensions aren't known at
build time. A fixed `1.91/1` box with `object-cover` reserves the space
instead. No post currently sets `image`, so this is preventative.

**Two things fixed opportunistically:** the 404 page got its own description
(it was the last page sharing the site tagline, though `noindex` made it
harmless), and the YouTube URL in `siteConfig.social` lost its `?si=` share
token, which had been leaking into `sameAs`.

### Verification results

Against `dist/` after build:

- Exactly one `<h1>` on all 8 page types checked, each with real text.
- 28 JSON-LD blocks, 0 invalid, `@type` present on every one.
- Meta descriptions unique across all 18 pages.
- Blog post emits `og:type=article` with `article:published_time`; homepage
  emits `website` with no `article:*`.
- Zero references to `fonts.googleapis.com` / `fonts.gstatic.com` and zero
  preconnects in the built output; 12 self-hosted woff2 subsets shipped.
- `document.fonts` confirms both variable families load and are used — the
  self-hosting didn't silently fall back.
- Avatar serves at 224×224 WebP, 17 KB.
- `robots.txt` present; sitemap lists 17 URLs and excludes `/404`.

## Out of scope

Deliberately excluded — each is low-yield at current content volume, and none
becomes harder to adopt later:

- Build-time generated per-post OG cards.
- Migrating content images to `astro:assets`.
- Full post content in RSS (`content:encoded`).
- Sitemap `changefreq` / `priority` tuning.
- Any content or copy rewriting.
