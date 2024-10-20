export type AdvancedGDrive = typeof gapi.client.drive & {
  uploadFile: (
    fileId: string,
    body: FileSystemWriteChunkType,
  ) => Promise<unknown>;
  downloadFile: (fileId: string, name?: string) => Promise<File>;
};

export enum GDriveScope {
  appdata = 'https://www.googleapis.com/auth/drive/appdata',
  appfolder = 'https://www.googleapis.com/auth/drive/appfolder',
  install = 'https://www.googleapis.com/auth/drive/install',
  file = 'https://www.googleapis.com/auth/drive/file',
  appsReadonly = 'https://www.googleapis.com/auth/drive/apps.readonly',
  readonly = 'https://www.googleapis.com/auth/drive/readonly',
  activity = 'https://www.googleapis.com/auth/drive/activity',
  activityReadonly = 'https://www.googleapis.com/auth/drive/activity.readonly',
  meetReadonly = 'https://www.googleapis.com/auth/drive/meet.readonly',
  metadata = 'https://www.googleapis.com/auth/drive/metadata',
  metadataReadonly = 'https://www.googleapis.com/auth/drive/metadata.readonly',
  scripts = 'https://www.googleapis.com/auth/drive/scripts',
  all = 'https://www.googleapis.com/auth/drive',
}
