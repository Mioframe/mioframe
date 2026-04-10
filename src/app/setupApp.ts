import type { App } from 'vue';
import { createApp } from 'vue';
import './styles/styles.css';
import MainApp from './MainApp.vue';
import { createHead } from '@unhead/vue/client';
import { router } from './router';
import { setupPlayground } from '@shared/lib/playground';
import { playgroundPages } from './playgroundPages';
import { backNavigationHandler } from '@shared/lib/onBackNavigation';
import { setupStackNavigation } from '@page/routes';
import { setupGoogleSessions } from '@entity/googleSession';
import { GOOGLE_CLIENT_ID } from '@shared/config';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = async (app: App = createApp(MainApp)) => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

  if (SENTRY_DSN?.length && import.meta.env.PROD) {
    const { setupSentry } = await import('./setupSentry');
    setupSentry(app, SENTRY_DSN);
  }
  setupStackNavigation(router);

  setupPlayground(router, playgroundPages);

  app.use(router);

  app.use(
    createHead({
      init: [
        {
          meta: [
            {
              name: 'viewport',
              content: 'width=device-width, initial-scale=1.0, interactive-widget=resizes-content',
            },
          ],
        },
      ],
    }),
  );

  app.use(backNavigationHandler);

  if (GOOGLE_CLIENT_ID) {
    setupGoogleSessions(GOOGLE_CLIENT_ID);
  }

  return app;
};
