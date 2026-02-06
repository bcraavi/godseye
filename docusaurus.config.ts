import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'GodsEye',
  tagline: 'AI-First Enterprise Platform for Retail',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://godseye.dev',
  baseUrl: '/',

  organizationName: 'godseye',
  projectName: 'godseye',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    navbar: {
      title: 'GodsEye',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'architectureSidebar',
          position: 'left',
          label: 'Architecture',
        },
        {
          href: 'https://github.com/godseye-platform/godseye',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} GodsEye Platform`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['go', 'hcl', 'yaml', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
