export type * from './types';
export { GOOGLE_DRIVE_SPACE, GOOGLE_FOLDER_MIME_TYPE } from './types';
export {
  type ApiOptions,
  type CreateResource,
  type DownloadParams,
  type GDriveFileMeta as GDriveFileResponse,
  type GDriveListResponse,
  type ListParams,
  type UpdateParams,
  SPACE,
  create,
  download,
  getGFileMetaList,
  update,
  upload,
  zodGDriveListResponse,
  zodGoogleErrorResponse,
  type GoogleAuthParams,
} from './api';
export { DriveQueryBuilder } from './DriveQueryBuilder';
export { GoogleDriveError } from './error';

// fixme: нужен адаптер гугл диска как сетевой комуникации, т.к. в оффлайн режиме работа с диском невозможна
/**
 * Может можно сделать оболочку для директорий, которая будет синхронизировать состояние директорий
 * добавлять отсутствующие файлы без удаления?
 * нужен будет адаптер для indexBD с разделением разных баз
 */
