import type {
  IterableCollection,
  ItemWithChildren,
} from '@shared/ui/TreeMenu/useIterable';

export type GDriveDirectory = {
  getName: () => string;
  rename: (newName: string) => Promise<GDriveDirectory>;
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
  addWatcher: (
    handler: (iterableCollection: GDriveDirectoryContent) => unknown,
  ) => void;
  /**
   * Remove directory state watcher
   */
  removeWatcher: (
    handler: (iterableCollection: GDriveDirectoryContent) => unknown,
  ) => void;
} & ItemWithChildren<string, GDriveFile | GDriveDirectory>;

export type GDriveFile = {
  getName: () => string;
  read: () => Promise<File>;
  remove: () => Promise<void>;
  rename: (newName: string) => Promise<GDriveFile>;
};

export const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export type GDriveDirectoryContent = IterableCollection<
  string,
  GDriveDirectory | GDriveFile
>;

export interface GDriveSpaces
  extends ItemWithChildren<string, GDriveDirectory | GDriveFile> {}
