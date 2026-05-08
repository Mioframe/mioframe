import type { App } from 'vue';
import { createApp } from 'vue';
import './styles/styles.css';
import MainApp from './MainApp.vue';
import { createHead } from '@unhead/vue/client';
import { router } from './router';
import { backNavigationHandler } from '@shared/lib/onBackNavigation';
import { SENTRY_DSN } from '@shared/config';
import { sentryPlugin } from '@shared/lib/setupSentry';
import { setupStackNavigation } from '@page/routes';

/**
 * Initializes the root Vue application and wires global app-level plugins.
 * @param app - Optional pre-created Vue app instance used by tests and alternative bootstraps.
 * @returns The configured Vue app instance.
 */
export const setupApp = async (app: App = createApp(MainApp)) => {
  app.use(sentryPlugin, {
    dsn: SENTRY_DSN,
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
  return app;
};
