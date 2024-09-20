import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles/styles.scss';
import MainView from './MainView.vue';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = () => {
  const app = createApp(MainView);

  return app;
};
