import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles/styles.scss';
import MainApp from './MainApp.vue';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = () => {
  const app = createApp(MainApp);

  return app;
};
