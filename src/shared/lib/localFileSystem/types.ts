import type {
  ItemWithChildren,
  IterableCollection,
} from '@shared/ui/TreeMenu/useIterable';

export type LocalEntryPath = string[];

export interface LocalEntry {
  getName: () => string;
  /**
   * Removes this Entry
   */
  remove: () => Promise<void>;
  getPath: () => LocalEntryPath;
}

export type LocalDirectoryContent = IterableCollection<
  string,
  LocalDirectory | LocalFile
>;

export interface LocalDirectory
  extends LocalEntry,
    ItemWithChildren<string, LocalDirectory | LocalFile> {
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<LocalDirectory>;
  /**
   * Writes a file to this directory
   */
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<LocalFile>;
  /**
   * Removes Entry from this directory
   */
  removeByName: (name: string) => Promise<void>;
  /**b
   * Copies this directory to the destination directory
   */
  copyTo: (dest: LocalDirectory) => Promise<LocalDirectory>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: LocalDirectory) => Promise<LocalDirectory>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<LocalDirectory>;
  /**
   * Get map of directory contents
   */
  // get: () => Promise<LocalDirectoryContent>;
  /**
   * Adding directory state watcher
   */
  addWatcher: (handler: (list: LocalDirectoryContent) => unknown) => void;
  /**
   * Remove directory state watcher
   */
  removeWatcher: (handler: (list: LocalDirectoryContent) => unknown) => void;
}

export interface LocalFile extends LocalEntry {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<LocalFile>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: LocalDirectory) => Promise<LocalFile>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: LocalDirectory) => Promise<LocalFile>;
}
