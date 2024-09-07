export interface EntryRef {
  /**
   * Name
   */
  readonly label: string;
  /**
   * Removes this Entry
   */
  remove: () => Promise<void>;
  readonly path: string[];
}

export type DirectoryList = Map<string, DirectoryEntryRef | FileEntryRef>;

export interface DirectoryEntryRef extends EntryRef {
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<DirectoryEntryRef>;
  /**
   * Writes a file to this directory
   */
  writeFile: (name: string, file?: File) => Promise<FileEntryRef>;
  /**
   * Copies this directory to the destination directory
   */
  copyTo: (dest: DirectoryEntryRef) => Promise<DirectoryEntryRef>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: DirectoryEntryRef) => Promise<DirectoryEntryRef>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<DirectoryEntryRef>;
  /**
   * Reactive map of directory contents
   */
  readonly list: DirectoryList;
}

export interface FileEntryRef extends EntryRef {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<FileEntryRef>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: DirectoryEntryRef) => Promise<FileEntryRef>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: DirectoryEntryRef) => Promise<FileEntryRef>;
}
