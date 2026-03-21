import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://rna.webnco.xyz',
  base: '/docs',
  integrations: [
    starlight({
      title: 'RNA Method',
      description: 'Official documentation for the RNA Method — a reusable agent architecture for AI-assisted software development.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/abhishek-mittal/rna-method' },
      ],
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      sidebar: [
        { label: 'Getting Started', link: '/getting-started' },
        {
          label: 'Guides',
          items: [
            { label: 'Cross-Platform Guide', link: '/guides/cross-platform' },
            { label: 'Failure Modes', link: '/guides/failure-modes' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Base Agent Signal Hub', link: '/concepts/base-agent-signal-hub' },
            { label: 'Context Compaction', link: '/concepts/context-compaction' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Schema Reference', link: '/reference/schema-reference' },
            { label: 'RNA Commands', link: '/reference/rna-commands' },
            { label: 'Folder Architecture', link: '/reference/folder-architecture' },
          ],
        },
        {
          label: 'Research',
          items: [
            { label: 'Research Paper', link: '/research/research-paper' },
            { label: 'Competitive Landscape', link: '/research/competitive-landscape' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      expressiveCode: {
        themes: ['dracula', 'github-light'],
      },
      head: [
        {
          tag: 'meta',
          attrs: { name: 'color-scheme', content: 'dark light' },
        },
      ],
    }),
  ],
  outDir: './dist',
});
