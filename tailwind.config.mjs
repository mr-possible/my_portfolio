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
