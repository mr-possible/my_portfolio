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
  // Typography ships its own table borders, which ignore the design tokens.
  // Headers go mono to match the rest of the system; the smaller type keeps
  // three-column comparison tables readable on a phone without a scroll
  // wrapper (markdown tables wrap their text rather than overflowing).
  'prose-table:text-sm',
  'prose-thead:border-edge',
  'prose-th:text-content prose-th:font-mono prose-th:font-medium',
  'prose-tr:border-edge',
  'prose-td:border-edge prose-td:align-top',
].join(' ');
