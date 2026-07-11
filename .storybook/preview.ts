import { setup } from '@storybook/vue3-vite';
import type { Preview } from '@storybook/vue3-vite';
import { createMemoryHistory, createRouter } from 'vue-router';
import 'material-symbols/rounded.css';
import '../src/app/styles/styles.css';
import './visual.css';

// Some shared overlay primitives (Menu, Sheets, Tooltips) depend on an
// installed vue-router instance for back-navigation handling. Storybook's
// preview app does not run the product router, so install a minimal
// routerless-navigation memory router here instead.
const storybookRouter = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { render: () => null } }],
});

setup((app) => {
  app.use(storybookRouter);
});

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        app: { name: 'App', value: 'var(--md-sys-color-background, #ffffff)' },
        surface: { name: 'Surface', value: 'var(--md-sys-color-surface, #ffffff)' },
      },
    },
    viewport: {
      options: {
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '900px' },
        },
        mobile: {
          name: 'Mobile',
          styles: { width: '393px', height: '852px' },
        },
      },
    },
  },
};

export default preview;
