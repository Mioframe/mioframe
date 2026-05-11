import type { Preview } from '@storybook/vue3-vite';
import 'material-symbols';
import '../src/app/styles/styles.css';
import './visual.css';

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
