import type { App } from 'vue';
import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles/styles.css';
import MainApp from './MainApp.vue';
import { createHead } from '@unhead/vue/client';
import { router } from './router';
import { setupPlayground } from '@shared/lib/playground';
import { playgroundPages } from './playgroundPages';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = async (app: App = createApp(MainApp)) => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

  if (SENTRY_DSN?.length && import.meta.env.PROD) {
    const { setupSentry } = await import('./setupSentry');
    setupSentry(app, SENTRY_DSN);
  }

  setupPlayground(router, playgroundPages);

  app.use(router);

  app.use(
    createHead({
      init: [
        {
          meta: [
            {
              name: 'viewport',
              content:
                'width=device-width, initial-scale=1.0, interactive-widget=resizes-content',
            },
          ],
        },
      ],
    }),
  );

  return app;
};
