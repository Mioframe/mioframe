import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles/styles.scss';
import MainApp from './MainApp.vue';
import { setupSentry } from './setupSentry';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = () => {
  const app = createApp(MainApp);

  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

  if (SENTRY_DSN?.length && import.meta.env.PROD) {
    setupSentry(app, SENTRY_DSN);
  }

  return app;
};
