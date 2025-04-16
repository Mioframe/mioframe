import { from } from 'ix/Ix.asynciterable';
import type { DirectoryFSEntry } from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';
import { createLogger } from '../logger';
import { isEqual, slice } from 'lodash-es';

const isNestedPath = (dest: string[], target: string[]) => {
  return (
    dest.length >= target.length &&
    isEqual(slice(dest, 0, target.length), target)
  );
};

const { debug } = createLogger('utils');

export const moveDirectoryTo = async (
  dest: DirectoryFSEntry,
  currentDirectoryEntry: DirectoryFSEntry,
) => {
  const parentPath = currentDirectoryEntry.path.slice(0, -1);

  debug('moveDirectoryTo', dest.path, parentPath);

  if (isNestedPath(dest.path, currentDirectoryEntry.path)) {
    throw new Error(
      `impossible to move "${currentDirectoryEntry.name}" from "${parentPath.join('/')}" to "${dest.path.join('/')}"`,
    );
  }

  const newDirectoryEntry = await dest.createDirectory(
    currentDirectoryEntry.name,
  );

  await from(currentDirectoryEntry.entries()).forEach(async ([, entry]) => {
    await entry.moveTo(newDirectoryEntry);
  });

  await currentDirectoryEntry.remove();

  return newDirectoryEntry;
};

export const copyDirectoryTo = async (
  dest: DirectoryFSEntry,
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
    await entry.copyTo(newDirectoryEntry);
  });

  return newDirectoryEntry;
};

export const copyFileTo = async (
  dest: DirectoryFSEntry,
  entry: FileFSEntry,
) => {
  const file = await entry.read();
  return await dest.writeFile(entry.name, file);
};

export const moveFileTo = async (
  dest: DirectoryFSEntry,
  entry: FileFSEntry,
) => {
  const newEntry = await copyFileTo(dest, entry);
  await entry.remove();
  return newEntry;
};
