import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
} from '../virtualFileSystem';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  VfsError,
} from '../virtualFileSystem';
import type { WriteOptions } from '../virtualFileSystem/IFileSystemProvider';

export class WebFileSystemProvider implements IFileSystemProvider {
  constructor(private rootHandle: FileSystemDirectoryHandle) {}

  private async getHandle(
    path: string,
    create: boolean,
    type: 'directory',
  ): Promise<FileSystemDirectoryHandle>;
  private async getHandle(
    path: string,
    create?: boolean,
    type?: 'file',
  ): Promise<FileSystemFileHandle>;
  private async getHandle(
    path: string,
    create: boolean = false,
    type: 'file' | 'directory' = 'file',
  ): Promise<FileSystemFileHandle | FileSystemDirectoryHandle> {
    const parts = PathUtils.normalize(path)
      .split('/')
      .filter((p) => p.length > 0);

    const name = parts.pop();

    if (!name) {
      return this.rootHandle;
    }

    let currentDir = this.rootHandle;

    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part, {
          create: false,
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'NotFoundError') {
          throw new VfsError(
            FileSystemError.FileNotFound,
            `Directory not found: ${part} in ${path}`,
          );
        }
        throw e;
      }
    }

    try {
      if (type === 'file') {
        return await currentDir.getFileHandle(name, { create });
      } else {
        return await currentDir.getDirectoryHandle(name, { create });
      }
    } catch (e) {
      if (e instanceof DOMException) {
        if (e.name === 'NotFoundError') {
          throw new VfsError(
            FileSystemError.FileNotFound,
            `Entry not found: ${name}`,
            e,
          );
        }
        if (e.name === 'TypeMismatchError') {
          throw new VfsError(
            type === 'file'
              ? FileSystemError.FileIsADirectory
              : FileSystemError.FileNotADirectory,
            `Type mismatch for: ${name}`,
            e,
          );
        }
      }
      throw e;
    }
  }

  private async fileHandleStat(
    handle: FileSystemFileHandle | FileSystemDirectoryHandle,
  ) {
    const permissionState = await handle.queryPermission?.();

    const canDelete = permissionState !== 'denied';

    if (handle.kind === 'file') {
      const file = await handle.getFile();
      return {
        type: FSNodeType.File,
        size: file.size,
        creationTime: file.lastModified,
        modificationTime: file.lastModified,
        canDelete,
      };
    } else {
      return {
        type: FSNodeType.Directory,
        canDelete,
      };
    }
  }

  public async stat(path: string): Promise<FSNodeStat> {
    const normalized = PathUtils.normalize(path);
    if (normalized === '/') {
      return {
        type: FSNodeType.Directory,
        canDelete: false,
      };
    }

    let handle: undefined | FileSystemFileHandle | FileSystemDirectoryHandle;
    try {
      handle = await this.getHandle(path, false, 'file');
    } catch {
      try {
        handle = await this.getHandle(path, false, 'directory');
      } catch {
        throw new VfsError(
          FileSystemError.FileNotFound,
          `Path not found: ${path}`,
        );
      }
    }

    return await this.fileHandleStat(handle);
  }

  public async readFile(path: string): Promise<File> {
    const handle = await this.getHandle(path, false, 'file');
    return handle.getFile();
  }

  public async writeFile(
    path: string,
    content: FileContent,
    { create, overwrite }: WriteOptions,
  ): Promise<void> {
    let handle: undefined | FileSystemFileHandle;

    try {
      handle = await this.getHandle(path, false, 'file');
      if (!overwrite) {
        throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
      }
    } catch (e) {
      if (e instanceof VfsError && e.code === FileSystemError.FileNotFound) {
        if (!create) throw e;
        handle = await this.getHandle(path, true, 'file');
      } else {
        throw e;
      }
    }

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  public async readDirectory(path: string): Promise<[string, FSNodeStat][]> {
    const directoryHandle = await this.getHandle(path, false, 'directory');

    const entries: [string, FSNodeStat][] = [];

    for await (const [name, childHandle] of directoryHandle.entries()) {
      entries.push([name, await this.fileHandleStat(childHandle)]);
    }

    return entries;
  }

  public async createDirectory(path: string): Promise<void> {
    try {
      await this.getHandle(path, false, 'directory');
      throw new VfsError(
        FileSystemError.FileExists,
        `Directory already exists: ${path}`,
      );
    } catch (e) {
      if (e instanceof VfsError && e.code === FileSystemError.FileNotFound) {
        await this.getHandle(path, true, 'directory');
        return;
      }
      throw e;
    }
  }

  public async delete(path: string, recursive: boolean): Promise<void> {
    const normalized = PathUtils.normalize(path);

    const stat = await this.stat(normalized);
    if (stat.canDelete !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Deletion is not allowed for path: ${path}`,
      );
    }

    const parts = PathUtils.normalize(path)
      .split('/')
      .filter((p) => p.length > 0);
    const name = parts.pop();
    if (!name) throw new Error('Cannot delete root');

    const parentPath = `/${parts.join('/')}`;
    const parentHandle = await this.getHandle(parentPath, false, 'directory');

    try {
      await parentHandle.removeEntry(name, { recursive });
    } catch (e) {
      if (e instanceof DOMException) {
        if (e.name === 'NotFoundError') {
          throw new VfsError(
            FileSystemError.FileNotFound,
            `Entry not found: ${path}`,
          );
        }
        if (e.name === 'InvalidModificationError') {
          throw new VfsError(
            FileSystemError.DirectoryNotEmpty,
            'Directory not empty (use recursive=true)',
          );
        }
      }
      throw e;
    }
  }

  public async move(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) return;

    let sourceHandle: FileSystemFileHandle | FileSystemDirectoryHandle;
    try {
      const stat = await this.stat(normalizedOld);
      if (stat.type === FSNodeType.File) {
        sourceHandle = await this.getHandle(normalizedOld, false, 'file');
      } else {
        sourceHandle = await this.getHandle(normalizedOld, false, 'directory');
      }
    } catch {
      throw new VfsError(
        FileSystemError.FileNotFound,
        `Source not found: ${oldPath}`,
      );
    }

    const newName = PathUtils.basename(normalizedNew);
    const newDirName = PathUtils.dirname(normalizedNew);
    const destinationDirHandle = await this.getHandle(
      newDirName,
      false,
      'directory',
    );

    if (sourceHandle.move) {
      await sourceHandle.move(destinationDirHandle, newName);
    } else if (sourceHandle.kind === 'file') {
      const file = await sourceHandle.getFile();

      const newFileHandle = await destinationDirHandle.getFileHandle(newName, {
        create: true,
      });
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      await this.delete(normalizedOld, false);
    } else {
      const newDirHandle = await destinationDirHandle.getDirectoryHandle(
        newName,
        {
          create: true,
        },
      );

      const copyDirectoryContents = async (
        sourceDir: FileSystemDirectoryHandle,
        destDir: FileSystemDirectoryHandle,
      ) => {
        for await (const entry of sourceDir.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const newFileHandle = await destDir.getFileHandle(entry.name, {
              create: true,
            });
            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();
          } else {
            const newSubDir = await destDir.getDirectoryHandle(entry.name, {
              create: true,
            });
            await copyDirectoryContents(entry, newSubDir);
          }
        }
      };

      await copyDirectoryContents(sourceHandle, newDirHandle);

      await this.delete(normalizedOld, true);
    }
  }
}
