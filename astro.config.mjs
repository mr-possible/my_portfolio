import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import markdoc from '@astrojs/markdoc';

const isDev = process.argv.includes('dev');

const integrations = [tailwind(), sitemap(), markdoc()];

if (isDev) {
  const react = (await import('@astrojs/react')).default;
  const keystatic = (await import('@keystatic/astro')).default;
  integrations.push(react(), keystatic());
}

export default defineConfig({
  site: 'https://www.sambhav.blog',
  output: 'static',
  integrations,
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
