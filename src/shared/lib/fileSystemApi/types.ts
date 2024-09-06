export type EntryPath = string[];

export interface EntryFileSystemApi {
  getName: () => string;
  /**
   * Removes this Entry
   */
  remove: () => Promise<void>;
  getPath: () => EntryPath;
}

export type DirectoryList = Map<string, DirectoryEntryFSApi | FileEntryFSApi>;

export interface DirectoryEntryFSApi extends EntryFileSystemApi {
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<DirectoryEntryFSApi>;
  /**
   * Writes a file to this directory
   */
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileEntryFSApi>;
  /**
   * Removes Entry from this directory
   */
  removeByName: (name: string) => Promise<void>;
  /**b
   * Copies this directory to the destination directory
   */
  copyTo: (dest: DirectoryEntryFSApi) => Promise<DirectoryEntryFSApi>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: DirectoryEntryFSApi) => Promise<DirectoryEntryFSApi>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<DirectoryEntryFSApi>;
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

export interface FileEntryFSApi extends EntryFileSystemApi {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<FileEntryFSApi>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: DirectoryEntryFSApi) => Promise<FileEntryFSApi>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: DirectoryEntryFSApi) => Promise<FileEntryFSApi>;
}
