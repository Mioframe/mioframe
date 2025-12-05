import { from } from 'ix/Ix.asynciterable';
import type {
  DirectoryFSEntry,
  WritableDirectoryFSEntry,
} from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import { isEqual } from 'es-toolkit';
import { DomainError } from '../error';
import { pathToString } from '@shared/service/directories';

const isNestedPath = (dest: string[], target: string[]) => {
  return (
    dest.length >= target.length &&
    isEqual(dest.slice(0, target.length), target)
  );
};

export const moveDirectoryTo = async (
  dest: WritableDirectoryFSEntry,
  currentDirectoryEntry: DirectoryFSEntry,
) => {
  const parentPath = currentDirectoryEntry.path.slice(0, -1);

  if (isNestedPath(dest.path, currentDirectoryEntry.path)) {
    throw new DomainError(
      `impossible to move "${currentDirectoryEntry.name}" from "${parentPath.join('/')}" to "${dest.path.join('/')}"`,
    );
  }

  const newDirectoryEntry = await dest.createDirectory(
    currentDirectoryEntry.name,
  );

  await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
    if (!('moveTo' in entry)) {
      throw new DomainError(
        `"${pathToString(entry.path)}" don't have moveTo method`,
      );
    }

    if (!('createDirectory' in newDirectoryEntry)) {
      throw new DomainError(
        `"${pathToString(newDirectoryEntry.path)}" don't writable directory`,
      );
    }

    await entry.moveTo(newDirectoryEntry);
  });

  if (!('remove' in currentDirectoryEntry)) {
    throw new DomainError(
      `"${pathToString(currentDirectoryEntry.path)}" don't have remove method`,
    );
  }

  await currentDirectoryEntry.remove();

  return newDirectoryEntry;
};

export const copyDirectoryTo = async (
  dest: WritableDirectoryFSEntry,
  currentDirectoryEntry: DirectoryFSEntry,
): Promise<DirectoryFSEntry> => {
  const currentPath = currentDirectoryEntry.path;

  const destPath = dest.path;

  if (isNestedPath(destPath, currentPath)) {
    throw new Error(
      `impossible to copy "${currentPath.join('/')}" to "${destPath.join('/')}"`,
    );
  }

  const currentEntryName = currentDirectoryEntry.name;

  const newDirectoryEntry = await dest.createDirectory(currentEntryName);

  await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
    if (!('copyTo' in entry)) {
      throw new DomainError(
        `"${pathToString(entry.path)}" don't have copyTo method`,
      );
    }

    if (!('createDirectory' in newDirectoryEntry)) {
      throw new DomainError(
        `"${pathToString(newDirectoryEntry.path)}" don't writable directory`,
      );
    }

    await entry.copyTo(newDirectoryEntry);
  });

  return newDirectoryEntry;
};

export const copyFileTo = async (
  dest: WritableDirectoryFSEntry,
  entry: FileFSEntry,
) => {
  const file = await entry.read();
  return await dest.writeFile(entry.name, file);
};

export const moveFileTo = async (
  dest: WritableDirectoryFSEntry,
  entry: FileFSEntry,
) => {
  const newEntry = await copyFileTo(dest, entry);
  await entry.remove();
  return newEntry;
};
