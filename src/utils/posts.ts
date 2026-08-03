import type { CollectionEntry } from 'astro:content';

/**
 * Shared ordering for every blog listing — the index, the home page's recent
 * posts, tag pages, and the RSS feed all read from here so they can't drift.
 *
 * Newest first by `pubDate`. Posts published on the same date tie on that
 * comparison, and a stable sort would then fall back to the glob loader's
 * alphabetical order, quietly putting the older post first. The descending
 * `id` tiebreaker keeps same-date ordering explicit instead of incidental.
 */
export function sortPostsByDate(
  posts: CollectionEntry<'blog'>[]
): CollectionEntry<'blog'>[] {
  return [...posts].sort(
    (a, b) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || b.id.localeCompare(a.id)
  );
}
