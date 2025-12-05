export type * from './types';
export { GOOGLE_DRIVE_SPACE as GDriveSpace } from './types';
export { createDirectoryGDriveEntry } from './createDirectoryGDriveEntry';
export { createFileGDriveEntry } from './createFileGDriveEntry';

// fixme: нужен адаптер гугл диска как сетевой комуникации, т.к. в оффлайн режиме работа с диском невозможна
/**
 * Может можно сделать оболочку для директорий, которая будет синхронизировать состояние директорий
 * добавлять отсутствующие файлы без удаления?
 * нужен будет адаптер для indexBD с разделением разных баз
 */
