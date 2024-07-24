import { createApp } from 'vue';
import '@fortawesome/fontawesome-free/css/all.css';
import FileManager from './FileManager.vue';
import './styles/styles.scss';

/**
 * Инициализация и настройка Vue приложения
 */
export const setupApp = () => {
  const app = createApp(FileManager);

  return app;
};
