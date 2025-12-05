import { z } from 'zod/v4-mini';

export type AdvancedGDrive = typeof gapi.client.drive & {
  uploadFile: (
    fileId: string,
    body: FileSystemWriteChunkType,
  ) => Promise<unknown>;
  downloadFile: (fileId: string, name?: string) => Promise<File>;
};

export enum USER_INFO_GOOGLE_SCOPE {
  userInfoProfile = 'https://www.googleapis.com/auth/userinfo.profile',
  userinfoEmail = 'https://www.googleapis.com/auth/userinfo.email',
}

export enum DRIVE_GOOGLE_SCOPE {
  /**
   * View and manage the app's own configuration data in your Google Drive.
   */
  appdata = 'https://www.googleapis.com/auth/drive.appdata',

  /**
   * View and manage the app's own configuration data in your Google Drive.
   * @deprecated use appdata
   */
  appFolder = 'https://www.googleapis.com/auth/drive.appfolder',

  /**
   * Allow apps to appear as an option in the "Open with" or the "New" menu.
   */
  install = 'https://www.googleapis.com/auth/drive.install',

  /**
   * Create new Drive files, or modify existing files, that you open with an app or that the user shares with an app while using the Google Picker API or the app's file picker.
   */
  file = 'https://www.googleapis.com/auth/drive.file',

  /**
   * View apps authorized to access your Drive.
   */
  appsReadonly = 'https://www.googleapis.com/auth/drive.apps.readonly',

  /**
   * View and download all your Drive files.
   */
  readonly = 'https://www.googleapis.com/auth/drive.readonly',

  /**
   * View and add to the activity record of files in your Drive.
   */
  activity = 'https://www.googleapis.com/auth/drive.activity',

  /**
   * View the activity record of files in your Drive.
   */
  activityReadonly = 'https://www.googleapis.com/auth/drive.activity.readonly',

  /**
   * View Drive files created or edited by Google Meet.
   */
  meetReadonly = 'https://www.googleapis.com/auth/drive.meet.readonly',

  /**
   * View and manage metadata of files in your Drive.
   */
  metadata = 'https://www.googleapis.com/auth/drive.metadata',

  /**
   * View metadata for files in your Drive.
   */
  metadataReadonly = 'https://www.googleapis.com/auth/drive.metadata.readonly',

  /**
   * Modify your Google Apps Script scripts' behavior.
   */
  scripts = 'https://www.googleapis.com/auth/drive.scripts',

  /**
   * View and manage all your Drive files.
   */
  all = 'https://www.googleapis.com/auth/drive',
}

export type GOOGLE_SCOPE = USER_INFO_GOOGLE_SCOPE | DRIVE_GOOGLE_SCOPE;

export const zodGOOGLE_SCOPE = z.union([
  z.enum(USER_INFO_GOOGLE_SCOPE),
  z.enum(DRIVE_GOOGLE_SCOPE),
]);
