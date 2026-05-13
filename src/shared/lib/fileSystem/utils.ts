import { from } from 'ix/Ix.asynciterable';
import type { DirectoryFSEntry, WritableDirectoryFSEntry } from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import { isEqual } from 'es-toolkit';
import { DomainError } from '../error';
import { FileSystemDomainErrorCode } from './fileSystemErrorCode';

const isNestedPath = (dest: string[], target: string[]) =>
  dest.length >= target.length && isEqual(dest.slice(0, target.length), target);

/**
 * Moves a directory into another writable directory entry.
 * @param dest - Destination directory entry.
 * @param currentDirectoryEntry - Directory entry to move.
 * @returns The moved directory entry in its new location.
 */
export const moveDirectoryTo = async (
  dest: WritableDirectoryFSEntry,
  currentDirectoryEntry: DirectoryFSEntry,
) => {
  if (isNestedPath(dest.path, currentDirectoryEntry.path)) {
    throw new DomainError('Could not move the directory', {
      code: FileSystemDomainErrorCode.directoryMoveFailed,
      cause: new Error('Cannot move a directory into itself or one of its subdirectories'),
    });
  }

  const newDirectoryEntry = await dest.createDirectory(currentDirectoryEntry.name);

  await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
    if (!('moveTo' in entry)) {
      throw new DomainError('Could not move the item', {
        code: FileSystemDomainErrorCode.entryMoveFailed,
        cause: new Error('The selected item does not support moving'),
      });
    }

    if (!('createDirectory' in newDirectoryEntry)) {
      throw new DomainError('Could not move the directory', {
        code: FileSystemDomainErrorCode.directoryMoveFailed,
        cause: new Error('The destination directory is not writable'),
      });
    }

    await entry.moveTo(newDirectoryEntry);
  });

  if (!('remove' in currentDirectoryEntry)) {
    throw new DomainError('Could not remove the directory', {
      code: FileSystemDomainErrorCode.directoryRemoveFailed,
      cause: new Error('The selected directory does not support removal'),
    });
  }

  await currentDirectoryEntry.remove();

  return newDirectoryEntry;
};

/**
 * Copies a directory into another writable directory entry.
 * @param dest - Destination directory entry.
 * @param currentDirectoryEntry - Directory entry to copy.
 * @returns The copied directory entry in its new location.
 */
export const copyDirectoryTo = async (
  dest: WritableDirectoryFSEntry,
  currentDirectoryEntry: DirectoryFSEntry,
): Promise<DirectoryFSEntry> => {
  const currentPath = currentDirectoryEntry.path;

  const destPath = dest.path;

  if (isNestedPath(destPath, currentPath)) {
    throw new DomainError('Could not copy the directory', {
      code: FileSystemDomainErrorCode.directoryCopyFailed,
      cause: new Error('Cannot copy a directory into itself or one of its subdirectories'),
    });
  }

  const currentEntryName = currentDirectoryEntry.name;

  const newDirectoryEntry = await dest.createDirectory(currentEntryName);

  await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
    if (!('copyTo' in entry)) {
      throw new DomainError('Could not copy the item', {
        code: FileSystemDomainErrorCode.entryCopyFailed,
        cause: new Error('The selected item does not support copying'),
      });
    }

    if (!('createDirectory' in newDirectoryEntry)) {
      throw new DomainError('Could not copy the directory', {
        code: FileSystemDomainErrorCode.directoryCopyFailed,
        cause: new Error('The destination directory is not writable'),
      });
    }

    await entry.copyTo(newDirectoryEntry);
  });

  return newDirectoryEntry;
};

/**
 * Copies a file into another writable directory entry.
 * @param dest - Destination directory entry.
 * @param entry - File entry to copy.
 * @returns The copied file entry in its new location.
 */
export const copyFileTo = async (dest: WritableDirectoryFSEntry, entry: FileFSEntry) => {
  const file = await entry.read();
  return dest.writeFile(entry.name, file);
};

/**
 * Moves a file into another writable directory entry.
 * @param dest - Destination directory entry.
 * @param entry - File entry to move.
 * @returns The moved file entry in its new location.
 */
export const moveFileTo = async (dest: WritableDirectoryFSEntry, entry: FileFSEntry) => {
  const newEntry = await copyFileTo(dest, entry);
  await entry.remove();
  return newEntry;
};
