import type {
  FileContent,
  FSNodeCapabilities,
  FSNodeStat,
  IFileSystemProvider,
  WriteFileResult,
} from '../virtualFileSystem';
import { FileSystemError, FSNodeType, PathUtils, VfsError } from '../virtualFileSystem';
import type { WriteOptions } from '../virtualFileSystem/IFileSystemProvider';

/**
 * Creates a VFS provider backed by the browser File System Access API.
 * @param rootHandle - Root directory handle for the mounted provider.
 * @returns VFS provider backed by browser file system handles.
 */
export const WebFileSystemProvider = (
  rootHandle: FileSystemDirectoryHandle,
): IFileSystemProvider => {
  const queryWritePermission = async (handle: FileSystemFileHandle | FileSystemDirectoryHandle) => {
    return (
      (await handle.queryPermission?.({ mode: 'readwrite' })) ?? (await handle.queryPermission?.())
    );
  };

  async function getHandle(
    path: string,
    create: boolean,
    type: 'directory',
  ): Promise<FileSystemDirectoryHandle>;
  async function getHandle(
    path: string,
    create?: boolean,
    type?: 'file',
  ): Promise<FileSystemFileHandle>;
  async function getHandle(
    path: string,
    create: boolean = false,
    type: 'file' | 'directory' = 'file',
  ): Promise<FileSystemFileHandle | FileSystemDirectoryHandle> {
    const parts = PathUtils.normalize(path)
      .split('/')
      .filter((part) => part.length > 0);

    const name = parts.pop();

    if (!name) {
      return rootHandle;
    }

    let currentDir = rootHandle;

    for (const part of parts) {
      try {
        // eslint-disable-next-line no-await-in-loop -- each directory handle lookup depends on the previously resolved parent directory
        currentDir = await currentDir.getDirectoryHandle(part, {
          create: false,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          throw new VfsError(
            FileSystemError.FileNotFound,
            `Directory not found: ${part} in ${path}`,
          );
        }
        throw error;
      }
    }

    try {
      if (type === 'file') {
        return await currentDir.getFileHandle(name, { create });
      }

      return await currentDir.getDirectoryHandle(name, { create });
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
          throw new VfsError(FileSystemError.FileNotFound, `Entry not found: ${name}`, error);
        }
        if (error.name === 'TypeMismatchError') {
          throw new VfsError(
            type === 'file' ? FileSystemError.FileIsADirectory : FileSystemError.FileNotADirectory,
            `Type mismatch for: ${name}`,
            error,
          );
        }
      }
      throw error;
    }
  }

  const fileHandleStat = async (
    handle: FileSystemFileHandle | FileSystemDirectoryHandle,
  ): Promise<FSNodeStat> => {
    const permissionState = await queryWritePermission(handle);
    const canWrite = permissionState !== 'denied';

    if (handle.kind === 'file') {
      const file = await handle.getFile();

      return {
        type: FSNodeType.File,
        size: file.size,
        creationTime: file.lastModified,
        modificationTime: file.lastModified,
        capabilities: {
          canDelete: canWrite,
          canChangePath: canWrite,
        } satisfies FSNodeCapabilities,
      };
    }

    return {
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: canWrite,
        canChangePath: canWrite,
        canEditChildren: canWrite,
      } satisfies FSNodeCapabilities,
    };
  };

  const stat = async (path: string): Promise<FSNodeStat> => {
    const normalized = PathUtils.normalize(path);
    if (normalized === '/') {
      const permissionState = await queryWritePermission(rootHandle);
      const canWrite = permissionState !== 'denied';

      return {
        type: FSNodeType.Directory,
        capabilities: {
          canDelete: false,
          canChangePath: false,
          canEditChildren: canWrite,
        },
      };
    }

    let handle: FileSystemFileHandle | FileSystemDirectoryHandle | undefined;
    try {
      handle = await getHandle(path, false, 'file');
    } catch {
      try {
        handle = await getHandle(path, false, 'directory');
      } catch {
        throw new VfsError(FileSystemError.FileNotFound, `Path not found: ${path}`);
      }
    }

    return fileHandleStat(handle);
  };

  const readFile = async (path: string): Promise<File> => {
    const handle = await getHandle(path, false, 'file');
    return handle.getFile();
  };

  const writeFile = async (
    path: string,
    content: FileContent,
    { create, overwrite }: WriteOptions,
  ): Promise<WriteFileResult> => {
    let handle: FileSystemFileHandle | undefined;

    try {
      handle = await getHandle(path, false, 'file');
      if (!overwrite) {
        throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
      }
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        if (!create) {
          throw error;
        }
        handle = await getHandle(path, true, 'file');
      } else {
        throw error;
      }
    }

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();

    return {
      stat: await fileHandleStat(handle),
    };
  };

  const readDirectory = async (path: string): Promise<[string, FSNodeStat][]> => {
    const directoryHandle = await getHandle(path, false, 'directory');
    const entries: [string, FSNodeStat][] = [];

    for await (const [name, childHandle] of directoryHandle.entries()) {
      entries.push([name, await fileHandleStat(childHandle)]);
    }

    return entries;
  };

  const createDirectory = async (path: string): Promise<void> => {
    try {
      await getHandle(path, false, 'directory');
      throw new VfsError(FileSystemError.FileExists, `Directory already exists: ${path}`);
    } catch (error) {
      if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
        await getHandle(path, true, 'directory');
        return;
      }
      throw error;
    }
  };

  const remove = async (path: string, recursive: boolean): Promise<void> => {
    const normalized = PathUtils.normalize(path);
    const nodeStat = await stat(normalized);

    if (nodeStat.capabilities?.canDelete !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Deletion is not allowed for path: ${path}`,
      );
    }

    const parts = normalized.split('/').filter((part) => part.length > 0);
    const name = parts.pop();

    if (!name) {
      throw new Error('Cannot delete root');
    }

    const parentPath = `/${parts.join('/')}`;
    const parentHandle = await getHandle(parentPath, false, 'directory');

    try {
      await parentHandle.removeEntry(name, { recursive });
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
          throw new VfsError(FileSystemError.FileNotFound, `Entry not found: ${path}`);
        }
        if (error.name === 'InvalidModificationError') {
          throw new VfsError(
            FileSystemError.DirectoryNotEmpty,
            'Directory not empty (use recursive=true)',
          );
        }
      }
      throw error;
    }
  };

  const move = async (oldPath: string, newPath: string): Promise<void> => {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) {
      return;
    }

    let sourceHandle: FileSystemFileHandle | FileSystemDirectoryHandle;
    try {
      const sourceStat = await stat(normalizedOld);
      if (sourceStat.capabilities?.canChangePath !== true) {
        throw new VfsError(
          FileSystemError.NoPermissions,
          `Path change is not allowed for path: ${oldPath}`,
        );
      }
      sourceHandle =
        sourceStat.type === FSNodeType.File
          ? await getHandle(normalizedOld, false, 'file')
          : await getHandle(normalizedOld, false, 'directory');
    } catch {
      throw new VfsError(FileSystemError.FileNotFound, `Source not found: ${oldPath}`);
    }

    const newName = PathUtils.basename(normalizedNew);
    const newDirName = PathUtils.dirname(normalizedNew);
    const destinationDirHandle = await getHandle(newDirName, false, 'directory');
    const destinationStat = await stat(newDirName);

    if (destinationStat.capabilities?.canEditChildren !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Path change is not allowed inside directory: ${newDirName}`,
      );
    }

    if (sourceHandle.move) {
      await sourceHandle.move(destinationDirHandle, newName);
      return;
    }

    if (sourceHandle.kind === 'file') {
      const file = await sourceHandle.getFile();
      const newFileHandle = await destinationDirHandle.getFileHandle(newName, {
        create: true,
      });
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      await remove(normalizedOld, false);
      return;
    }

    const newDirHandle = await destinationDirHandle.getDirectoryHandle(newName, {
      create: true,
    });

    const copyDirectoryContents = async (
      sourceDir: FileSystemDirectoryHandle,
      destDir: FileSystemDirectoryHandle,
    ): Promise<void> => {
      for await (const entry of sourceDir.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const newFileHandle = await destDir.getFileHandle(entry.name, {
            create: true,
          });
          const writable = await newFileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          continue;
        }

        const newSubDir = await destDir.getDirectoryHandle(entry.name, {
          create: true,
        });
        await copyDirectoryContents(entry, newSubDir);
      }
    };

    await copyDirectoryContents(sourceHandle, newDirHandle);
    await remove(normalizedOld, true);
  };

  return {
    stat,
    readFile,
    writeFile,
    readDirectory,
    createDirectory,
    delete: remove,
    move,
  };
};
