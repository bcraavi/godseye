import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  architectureSidebar: [
    'overview',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/five-layers',
        'architecture/infrastructure',
        'architecture/engineering-platform',
        'architecture/ai-engine',
        'architecture/business-operations',
        'architecture/customer-experience',
      ],
    },
    {
      type: 'category',
      label: 'Core Systems',
      collapsed: false,
      items: [
        'systems/authentication',
        'systems/payments',
        'systems/load-balancing',
        'systems/data-sync',
        'systems/pos',
        'systems/commerce-engine',
      ],
    },
    {
      type: 'category',
      label: 'AI Agents',
      collapsed: false,
      items: [
        'ai/agent-mesh',
        'ai/customer-ai',
        'ai/operations-ai',
        'ai/business-ai',
      ],
    },
    {
      type: 'category',
      label: 'Strategy',
      collapsed: false,
      items: [
        'strategy/build-vs-buy',
        'strategy/multi-cloud',
        'strategy/multi-tenant',
        'strategy/tech-stack',
      ],
    },
  ],
};

export default sidebars;
