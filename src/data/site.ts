export const siteConfig = {
  title: 'Sambhav Dave',
  description: 'Software Engineer | SDET',
  tagline:
    'Skilled software engineer with 5+ years of full-time professional experience',
  author: 'Sambhav Dave',
  avatar: '/images/dp.jpg',
  social: [
    {
      name: 'GitHub',
      url: 'https://github.com/mr-possible',
      icon: 'github',
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/DaveSambhav',
      icon: 'twitter',
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/sambhav6197/',
      icon: 'linkedin',
    },
    {
      name: 'Medium',
      url: 'https://medium.com/@mr_possible',
      icon: 'medium',
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com/@mr_possible6197?si=gdgCWTw9bOTrOdjt',
      icon: 'youtube',
    },
  ],
  nav: [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Projects', path: '/projects' },
    { name: 'Blog', path: '/blog' },
  ],
} as const;
