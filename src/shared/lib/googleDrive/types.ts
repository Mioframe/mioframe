export interface GDriveDirectory {
  getName: () => string;
  rename: (newName: string) => Promise<GDriveDirectory>;
  get: () => Promise<Map<string, GDriveFile | GDriveDirectory>>;
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<GDriveFile>;
  removeByName: (name: string) => Promise<void>;
  remove: () => Promise<void>;
  createDirectory: (name: string) => Promise<GDriveDirectory>;
  /**
   * Adding directory state watcher
   */
  addWatcher: (handler: (list: GDriveDirectoryContent) => unknown) => void;
  /**
   * Remove directory state watcher
   */
  removeWatcher: (handler: (list: GDriveDirectoryContent) => unknown) => void;
}

export interface GDriveFile {
  getName: () => string;
  read: () => Promise<File>;
  remove: () => Promise<void>;
  rename: (newName: string) => Promise<GDriveFile>;
}

export const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export type GDriveDirectoryContent = Map<string, GDriveDirectory | GDriveFile>;
