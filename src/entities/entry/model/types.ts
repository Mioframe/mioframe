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

export type DirectoryList = Map<string, LocalDirectoryRef | LocalFileRef>;

export interface LocalDirectoryRef extends EntryRef {
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<LocalDirectoryRef>;
  /**
   * Writes a file to this directory
   */
  writeFile: (name: string, file?: File) => Promise<LocalFileRef>;
  /**
   * Copies this directory to the destination directory
   */
  copyTo: (dest: LocalDirectoryRef) => Promise<LocalDirectoryRef>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: LocalDirectoryRef) => Promise<LocalDirectoryRef>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<LocalDirectoryRef>;
  /**
   * Reactive map of directory contents
   */
  readonly list: DirectoryList;
}

export interface LocalFileRef extends EntryRef {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<LocalFileRef>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: LocalDirectoryRef) => Promise<LocalFileRef>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: LocalDirectoryRef) => Promise<LocalFileRef>;
}
