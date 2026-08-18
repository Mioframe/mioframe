import type { App } from 'vue';
import { createApp } from 'vue';
import './styles/styles.css';
import MainApp from './MainApp.vue';
import { createHead } from '@unhead/vue/client';
import { router } from './router';
import { backNavigationHandler } from '@shared/lib/onBackNavigation';
import { SENTRY_DSN, APP_BUILD_ID, APP_VERSION, IS_VERBOSE_DIAGNOSTICS } from '@shared/config';
import { sentryPlugin } from '@shared/lib/diagnostics';
import { registerLazyVueSentryBackend } from '@shared/lib/diagnostics/sentryVueBackend';
import { setupStackNavigation } from '@page/routes';

/**
 * Initializes the root Vue application and wires global app-level plugins.
 * @param app - Optional pre-created Vue app instance used by tests and alternative bootstraps.
 * @returns The configured Vue app instance.
 */
export const setupApp = (app: App = createApp(MainApp)) => {
  registerLazyVueSentryBackend();
  app.use(sentryPlugin, {
    dsn: SENTRY_DSN,
    isVerbose: IS_VERBOSE_DIAGNOSTICS,
    enabled: import.meta.env.PROD,
    release: APP_BUILD_ID || APP_VERSION,
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
