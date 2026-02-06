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

  url: 'https://bcraavi.github.io',
  baseUrl: '/godseye/',

  organizationName: 'bcraavi',
  projectName: 'godseye',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    mermaid: true,
  },

  clientModules: ['./src/diagram-zoom.js'],

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
      theme: {light: 'neutral', dark: 'base'},
      options: {
        themeVariables: {
          darkMode: true,
          background: '#111827',
          primaryColor: '#0c4a6e',
          primaryTextColor: '#e2e8f0',
          primaryBorderColor: '#0ea5e9',
          secondaryColor: '#1e3a5f',
          secondaryTextColor: '#e2e8f0',
          secondaryBorderColor: '#38bdf8',
          tertiaryColor: '#1a2e4a',
          tertiaryTextColor: '#e2e8f0',
          tertiaryBorderColor: '#7dd3fc',
          lineColor: '#475569',
          textColor: '#e2e8f0',
          mainBkg: '#0c4a6e',
          nodeBorder: '#0ea5e9',
          clusterBkg: '#0f172a',
          clusterBorder: '#1e40af',
          titleColor: '#f1f5f9',
          edgeLabelBackground: '#1e293b',
          nodeTextColor: '#e2e8f0',
        },
      },
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
