import { createApp } from 'vue';
import AppComponent from './App.vue';
import './styles/styles.scss';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = () => {
  const app = createApp(AppComponent);

  return app;
};
