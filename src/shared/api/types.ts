export type EntryPath = string[];

export interface EntryApi {
  getName: () => string;
  /**
   * Removes this Entry
   */
  remove: () => Promise<void>;
  getPath: () => EntryPath;
}

export type DirectoryList = Map<string, DirectoryEntryApi | FileEntryApi>;

export interface DirectoryEntryApi extends EntryApi {
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<DirectoryEntryApi>;
  /**
   * Writes a file to this directory
   */
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileEntryApi>;
  /**
   * Removes Entry from this directory
   */
  removeByName: (name: string) => Promise<void>;
  /**b
   * Copies this directory to the destination directory
   */
  copyTo: (dest: DirectoryEntryApi) => Promise<DirectoryEntryApi>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: DirectoryEntryApi) => Promise<DirectoryEntryApi>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<DirectoryEntryApi>;
  /**
   * Get map of directory contents
   */
  getList: () => Promise<DirectoryList>;
  /**
   * Adding directory state watcher
   */
  addWatcher: (handler: (list: DirectoryList) => unknown) => void;
  /**
   * Remove directory state watcher
   */
  removeWatcher: (handler: (list: DirectoryList) => unknown) => void;
}

export interface FileEntryApi extends EntryApi {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<FileEntryApi>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: DirectoryEntryApi) => Promise<FileEntryApi>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: DirectoryEntryApi) => Promise<FileEntryApi>;
}
