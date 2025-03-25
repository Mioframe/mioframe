import { from } from 'ix/Ix.asynciterable';
import type { DirectoryFSEntry } from './DirectoryFSEntry';
import type { FileFSEntry } from './FileFSEntry';

export const childHasParent = (
  childPath: string[],
  parentPath: string[],
): boolean => {
  if (parentPath.length > childPath.length) {
    return false;
  }

  for (let i = 0; i < parentPath.length; i++) {
    if (childPath[i] !== parentPath[i]) {
      return false;
    }
  }

  return true;
};

export const moveDirectoryTo = async (
  dest: DirectoryFSEntry,
  currentDirectoryEntry: DirectoryFSEntry,
) => {
  const parentPath = currentDirectoryEntry.path.slice(
    0,
    currentDirectoryEntry.path.length - 2,
  );

  if (childHasParent(dest.path, parentPath)) {
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

  if (childHasParent(destPath, currentPath)) {
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
