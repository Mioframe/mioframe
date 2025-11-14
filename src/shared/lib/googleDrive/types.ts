import type {
  DirectoryFSEntry,
  FileFSEntry,
  GeneralFSEntry,
  ReadOnlyDirectoryFSEntry,
} from '../fileSystem';
import type { ReadOnlyStaticDirectoryFSEntry } from '../fileSystem/DirectoryFSEntry';

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
  children: () => AsyncIterator<[string, GDriveDirectory | GDriveFile]>;
};

export type GDriveFile = {
  getName: () => string;
  read: () => Promise<File>;
  remove: () => Promise<void>;
  rename: (newName: string) => Promise<GDriveFile>;
};

export const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export type GDriveDirectoryContent = Iterable<
  [string, GDriveDirectory | GDriveFile]
>;

export interface GDriveEntry extends GeneralFSEntry {}

export interface ReadOnlyDirectoryGDriveEntry extends ReadOnlyDirectoryFSEntry {
  gDriveFileId: string;
  gDriveSpace: GDriveSpace;
}

export interface DirectoryGDriveEntry
  extends ReadOnlyDirectoryGDriveEntry,
    DirectoryFSEntry {}

export interface FileGDriveEntry extends FileFSEntry {
  // gDrive: AdvancedGDrive;
  gDriveFileId: string;
  gDriveSpace: GDriveSpace;
}

export enum GDriveSpace {
  // user drive
  MyDrive = 'My Drive',
  // drive with shared data
  SharedWithMe = 'Shared With Me',
  appDataFolder = 'App Data Folder',
}

export interface RootGDriveEntry extends ReadOnlyStaticDirectoryFSEntry {}
