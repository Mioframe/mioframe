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
export const setupApp = (app: App = createApp(MainApp)) => {
  app.use(sentryPlugin, {
    dsn: SENTRY_DSN,
    enabled: import.meta.env.PROD,
  });

  setupStackNavigation(router);

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
