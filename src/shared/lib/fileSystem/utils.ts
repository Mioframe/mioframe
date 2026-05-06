import { from } from 'ix/Ix.asynciterable';
import type { DirectoryFSEntry, WritableDirectoryFSEntry } from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import { isEqual } from 'es-toolkit';
import { pathToString } from '@shared/service/directories';
import { DomainError } from '../error';

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
      cause: new Error(
        `impossible to move "${currentDirectoryEntry.name}" from "${currentDirectoryEntry.path.slice(0, -1).join('/')}" to "${dest.path.join('/')}"`,
      ),
    });
  }

  const newDirectoryEntry = await dest.createDirectory(currentDirectoryEntry.name);

  await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
    if (!('moveTo' in entry)) {
      throw new DomainError('Could not move the item', {
        cause: new Error(`"${pathToString(entry.path)}" don't have moveTo method`),
      });
    }

    if (!('createDirectory' in newDirectoryEntry)) {
      throw new DomainError('Could not move the directory', {
        cause: new Error(`"${pathToString(newDirectoryEntry.path)}" don't writable directory`),
      });
    }

    await entry.moveTo(newDirectoryEntry);
  });

  if (!('remove' in currentDirectoryEntry)) {
    throw new DomainError('Could not remove the directory', {
      cause: new Error(`"${pathToString(currentDirectoryEntry.path)}" don't have remove method`),
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
      cause: new Error(`impossible to copy "${currentPath.join('/')}" to "${destPath.join('/')}"`),
    });
  }

  const currentEntryName = currentDirectoryEntry.name;

  const newDirectoryEntry = await dest.createDirectory(currentEntryName);

  await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
    if (!('copyTo' in entry)) {
      throw new DomainError('Could not copy the item', {
        cause: new Error(`"${pathToString(entry.path)}" don't have copyTo method`),
      });
    }

    if (!('createDirectory' in newDirectoryEntry)) {
      throw new DomainError('Could not copy the directory', {
        cause: new Error(`"${pathToString(newDirectoryEntry.path)}" don't writable directory`),
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
