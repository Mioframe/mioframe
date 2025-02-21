import type { Reactive } from 'vue';

export type EntryPath = string[];

export interface RefEntry
  extends Reactive<{
    name: string;
    path: EntryPath;
  }> {
  /**
   * Removes this Entry
   */
  remove: () => Promise<void>;
}

export interface RefFile extends RefEntry {
  /**
   * Reads this file
   */
  read: () => Promise<File>;
  /**
   * Renames this file by copying and creating with the same contents
   */
  rename: (newName: string) => Promise<RefFile>;
  /**
   * Copies the file to the destination directory
   */
  copyTo: (dest: RefDirectory) => Promise<RefFile>;
  /**
   * Moves this file to the destination directory by copying and deleting this file
   */
  moveTo: (dest: RefDirectory) => Promise<RefFile>;
}

export interface RefDirectory
  extends RefEntry,
    Reactive<{
      entries: Iterable<[PropertyKey, RefDirectory | RefFile]>;
    }> {
  /**
   * Creates a subdirectory
   */
  createDirectory: (name: string) => Promise<RefDirectory>;
  /**
   * Writes a file to this directory
   */
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<RefFile>;
  /**
   * Removes Entry from this directory
   */
  removeByName: (name: string) => Promise<void>;
  /**b
   * Copies this directory to the destination directory
   */
  copyTo: (dest: RefDirectory) => Promise<RefDirectory>;
  /**
   * Moves this directory to the destination directory by means of copying and deleting this
   */
  moveTo: (dest: RefDirectory) => Promise<RefDirectory>;
  /**
   * Rename this directory by copying the contents to a new directory
   */
  rename: (newName: string) => Promise<RefDirectory>;
}
