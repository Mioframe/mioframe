export interface Entry {
  readonly name: string;
  /**
   * Removes this Entry
   */
  remove: () => Promise<void>;
}

export type DirectoryList = Map<string, DirectoryEntry | FileEntry>;

export interface DirectoryEntry extends Entry {
  /**
   * Creates a Map with the contents of this directory
   */
  getDirectoryList: () => Promise<DirectoryList>;
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<DirectoryEntry>;
  /**
   * Writes a file to this directory
   */
  writeFile: (name: string, file?: File) => Promise<FileEntry>;
  /**
   * Removes Entry from this directory
   */
  removeByName: (name: string) => Promise<void>;
  /**
   * Copies this directory to the destination directory
   */
  copyTo: (dest: DirectoryEntry) => Promise<DirectoryEntry>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: DirectoryEntry) => Promise<DirectoryEntry>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<DirectoryEntry>;
}

export interface FileEntry extends Entry {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<FileEntry>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: DirectoryEntry) => Promise<FileEntry>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: DirectoryEntry) => Promise<FileEntry>;
}
