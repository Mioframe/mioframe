import type { ItemWithChildren } from '@shared/lib/useIterable';
import type {
  DirectoryFSEntry,
  FileFSEntry,
  GeneralFSEntry,
} from '../fileSystem';
import type { AdvancedGDrive } from '../googleApi/types';

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

export interface GDriveSpaces
  extends ItemWithChildren<[string, GDriveDirectory | GDriveFile]> {}

export interface GDriveEntry extends GeneralFSEntry {}

export interface DirectoryGDriveEntry extends DirectoryFSEntry {
  gDrive: AdvancedGDrive;
  gDriveFileId: string;
  gDriveSpace: GDriveSpace;
}

export interface FileGDriveEntry extends FileFSEntry {
  gDrive: AdvancedGDrive;
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
