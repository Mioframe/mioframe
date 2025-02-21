import type { Collection } from '@shared/ui/TreeMenu/useIterable';
import type { RefDirectory, RefEntry, RefFile } from '../refFileSystem';

export type LocalEntryPath = string[];

export interface RefLocalEntry extends RefEntry {
  // getName: () => string;
  // /**
  //  * Removes this Entry
  //  */
  // remove: () => Promise<void>;
  // getPath: () => LocalEntryPath;
}

export type LocalDirectoryContent = Collection<
  [string, RefLocalDirectory | RefLocalFile]
>;

export interface RefLocalDirectory /*  RefLocalEntry,
    ItemWithChildren<[string, RefLocalDirectory | RefLocalFile]>, */
  extends RefDirectory {
  // /**
  //  * Creates a subdirectory
  //  */
  // createDirectory: (name: string) => Promise<RefLocalDirectory>;
  // /**
  //  * Writes a file to this directory
  //  */
  // writeFile: (
  //   name: string,
  //   file?: FileSystemWriteChunkType,
  // ) => Promise<RefLocalFile>;
  // /**
  //  * Removes Entry from this directory
  //  */
  // removeByName: (name: string) => Promise<void>;
  // /**b
  //  * Copies this directory to the destination directory
  //  */
  // copyTo: (dest: RefLocalDirectory) => Promise<RefLocalDirectory>;
  // /**
  //  * Moves this directory to the destination directory by means of copying and deleting this
  //  */
  // moveTo: (dest: RefLocalDirectory) => Promise<RefLocalDirectory>;
  // /**
  //  * Rename this directory by copying the contents to a new directory
  //  */
  // rename: (newName: string) => Promise<RefLocalDirectory>;
  // /**
  //  * Get map of directory contents
  //  */
  // // get: () => Promise<LocalDirectoryContent>;
  // /**
  //  * Adding directory state watcher
  //  */
  // addWatcher: (handler: (list: LocalDirectoryContent) => unknown) => void;
  // /**
  //  * Remove directory state watcher
  //  */
  // removeWatcher: (handler: (list: LocalDirectoryContent) => unknown) => void;
}

export interface RefLocalFile extends RefFile {
  // /**
  //  * Reads this file
  //  */
  // read: () => Promise<File>;
  // /**
  //  * Renames this file by copying and creating with the same contents
  //  */
  // rename: (newName: string) => Promise<RefLocalFile>;
  // /**
  //  * Copies the file to the destination directory
  //  */
  // copyTo: (dest: RefLocalDirectory) => Promise<RefLocalFile>;
  // /**
  //  * Moves this file to the destination directory by copying and deleting this file
  //  */
  // moveTo: (dest: RefLocalDirectory) => Promise<RefLocalFile>;
}
