import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles/styles.css';
import MainApp from './MainApp.vue';
import { setupSentry } from './setupSentry';
import { createPinia } from 'pinia';
import { router } from './router';
import { createHead } from '@unhead/vue';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = () => {
  const app = createApp(MainApp);

  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

  if (SENTRY_DSN?.length && import.meta.env.PROD) {
    setupSentry(app, SENTRY_DSN);
  }

  app.use(createHead());

  app.use(router);

  app.use(createPinia());

  return app;
};
