/**
 * JSON-LD builders.
 *
 * Pure functions returning plain objects — no Astro imports, no rendering — so
 * the emitted shape is readable here and BaseLayout only has to serialize it.
 *
 * The `@id` values are stable anchors, not fetchable URLs: `#person` lets
 * BlogPosting.author reference the same entity the homepage declares, instead
 * of restating it on every page. That single-entity-many-references shape is
 * what search engines consolidate into one identity.
 */
import { siteConfig } from '../data/site';

const abs = (path: string) => new URL(path, siteConfig.url).href;

const PERSON_ID = abs('/#person');
const SITE_ID = abs('/#website');

/** Handles live in `social` as profile URLs; Twitter meta tags want `@name`. */
export function twitterHandle(): string | undefined {
  const url = siteConfig.social.find((s) => s.icon === 'twitter')?.url;
  const name = url?.split('/').filter(Boolean).pop();
  return name ? `@${name}` : undefined;
}

/**
 * The entity signal for name searches. `sameAs` is built from siteConfig.social
 * rather than restated, so adding a profile there propagates here.
 */
export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: siteConfig.author,
    url: siteConfig.url,
    image: abs(siteConfig.avatar),
    jobTitle: siteConfig.jobTitle,
    description: siteConfig.tagline,
    sameAs: siteConfig.social.map((s) => s.url),
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: siteConfig.title,
    url: siteConfig.url,
    description: siteConfig.tagline,
    inLanguage: 'en',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
  };
}

interface PostForSchema {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  image?: string;
}

export function blogPostingSchema(post: PostForSchema, pathname: string) {
  const url = abs(pathname);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: post.title,
    description: post.description,
    datePublished: post.pubDate.toISOString(),
    // Absent updatedDate, Google treats dateModified as the publish date anyway;
    // stating it explicitly avoids it guessing from the crawl instead.
    dateModified: (post.updatedDate ?? post.pubDate).toISOString(),
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': SITE_ID },
    mainEntityOfPage: url,
    url,
    image: abs(post.image ?? siteConfig.ogImage),
    keywords: post.tags,
    inLanguage: 'en',
  };
}

export function breadcrumbSchema(trail: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}

/** A tag archive is a list of posts, not an article — CollectionPage says so. */
export function collectionPageSchema(name: string, pathname: string, postUrls: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: abs(pathname),
    isPartOf: { '@id': SITE_ID },
    author: { '@id': PERSON_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: postUrls.map((url, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(url),
      })),
    },
  };
}
