export type * from './types';
export { GOOGLE_DRIVE_SPACE, GOOGLE_FOLDER_MIME_TYPE } from './types';
export {
  simplifiedGoogleDriveAPI,
  SPACE,
  type GoogleAuthParams,
} from './simplifiedAPI';
export { DriveQueryBuilder } from './DriveQueryBuilder';

// fixme: нужен адаптер гугл диска как сетевой комуникации, т.к. в оффлайн режиме работа с диском невозможна
/**
 * Может можно сделать оболочку для директорий, которая будет синхронизировать состояние директорий
 * добавлять отсутствующие файлы без удаления?
 * нужен будет адаптер для indexBD с разделением разных баз
 */
