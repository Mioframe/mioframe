import type { App } from 'vue';
import { createApp } from 'vue';
import './styles/styles.css';
import MainApp from './MainApp.vue';
import { createHead } from '@unhead/vue/client';
import { router } from './router';
import { backNavigationHandler } from '@shared/lib/onBackNavigation';
import { sentryPlugin } from '@shared/lib/setupSentry';
import { setupStackNavigation } from '@page/routes';
import { setupGoogleSessions } from '@entity/googleSession';
import { GOOGLE_CLIENT_ID } from '@shared/config';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = async (app: App = createApp(MainApp)) => {
  app.use(sentryPlugin, {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: import.meta.env.PROD,
  });

  setupStackNavigation(router);

  if (import.meta.env.DEV) {
    const [{ setupPlayground }, { playgroundPages }] = await Promise.all([
      import('@shared/lib/playground'),
      import('./playgroundPages'),
    ]);

    setupPlayground(router, playgroundPages);
  }

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
