import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles/styles.css';
import MainApp from './MainApp.vue';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue/client';
import { router } from './router';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = async () => {
  const app = createApp(MainApp);

  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

  if (SENTRY_DSN?.length && import.meta.env.PROD) {
    const { setupSentry } = await import('./setupSentry')
    setupSentry(app, SENTRY_DSN);
  }

  app.use(router);

  app.use(createHead());

  app.use(createPinia());

  return app;
};
