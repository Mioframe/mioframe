import type {
  IFileSystemProvider,
  FileStat,
  FileContent,
  WriteOptions,
} from './IFileSystemProvider';
import { FileType } from './IFileSystemProvider';
import { PathUtils } from './PathUtils';
import { VfsError, FileSystemError } from './VfsError';
import { EventEmitter, type VfsEvent } from './EventEmitter';

declare global {
  interface FileSystemHandle {
    move?(
      destination: FileSystemDirectoryHandle,
      newName: string,
    ): Promise<void>;
  }
}

export class WebFileSystem implements IFileSystemProvider {
  private events = new EventEmitter();

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

    let currentDir = this.rootHandle;

    // Проходим по всем папкам до родительской
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
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

    const name = parts.at(parts.length - 1);

    // Если запрошен корень
    if (!name) {
      return this.rootHandle;
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
          );
        }
        if (e.name === 'TypeMismatchError') {
          throw new VfsError(
            type === 'file'
              ? FileSystemError.FileIsADirectory
              : FileSystemError.FileNotADirectory,
            `Type mismatch for: ${name}`,
          );
        }
      }
      throw e;
    }
  }

  public async stat(path: string): Promise<FileStat> {
    const normalized = PathUtils.normalize(path);
    if (normalized === '/') {
      return {
        type: FileType.Directory,
        size: 0,
        creationTime: Date.now(),
        modificationTime: Date.now(),
      };
    }

    // Явно указываем объединение типов, чтобы работал Type Narrowing
    let handle: FileSystemFileHandle | FileSystemDirectoryHandle;
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

    if (handle.kind === 'file') {
      const file = await handle.getFile();
      return {
        type: FileType.File,
        size: file.size,
        creationTime: file.lastModified,
        modificationTime: file.lastModified,
      };
    } else {
      return {
        type: FileType.Directory,
        size: 0,
        creationTime: 0,
        modificationTime: 0,
      };
    }
  }

  public async readFile(path: string): Promise<File> {
    const handle = await this.getHandle(path, false, 'file');
    return handle.getFile();
  }

  public async writeFile(
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<void> {
    let handle: FileSystemFileHandle;

    try {
      handle = await this.getHandle(path, false, 'file');
      if (!options.overwrite) {
        throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
      }
    } catch (e) {
      if (e instanceof VfsError && e.code === FileSystemError.FileNotFound) {
        if (!options.create) throw e;
        handle = await this.getHandle(path, true, 'file');
        this.events.emit({ type: 'create', path });
      } else {
        throw e;
      }
    }

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();

    this.events.emit({ type: 'update', path });
  }

  public async readDirectory(path: string): Promise<[string, FileType][]> {
    const handle = await this.getHandle(path, false, 'directory');
    const entries: [string, FileType][] = [];

    for await (const [name, entry] of handle.entries()) {
      entries.push([
        name,
        entry.kind === 'file' ? FileType.File : FileType.Directory,
      ]);
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
        this.events.emit({ type: 'create', path });
        return;
      }
      throw e;
    }
  }

  public async delete(path: string, recursive: boolean): Promise<void> {
    const parts = PathUtils.normalize(path)
      .split('/')
      .filter((p) => p.length > 0);
    const name = parts.pop();
    if (!name) throw new Error('Cannot delete root');

    const parentPath = `/${parts.join('/')}`;
    const parentHandle = await this.getHandle(parentPath, false, 'directory');

    try {
      await parentHandle.removeEntry(name, { recursive });
      this.events.emit({ type: 'delete', path });
    } catch (e) {
      if (e instanceof DOMException) {
        if (e.name === 'NotFoundError') {
          throw new VfsError(
            FileSystemError.FileNotFound,
            `Entry not found: ${path}`,
          );
        }
        if (e.name === 'InvalidModificationError') {
          throw new Error('Directory not empty (use recursive=true)');
        }
      }
      throw e;
    }
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) return;

    let sourceHandle: FileSystemFileHandle | FileSystemDirectoryHandle;
    try {
      const stat = await this.stat(normalizedOld);
      if (stat.type === FileType.File) {
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
      try {
        await sourceHandle.move(destinationDirHandle, newName);
        this.events.emit({
          type: 'rename',
          path: normalizedOld,
          newPath: normalizedNew,
        });
        return;
      } catch (e) {
        console.warn('Native move failed, falling back to copy-delete', e);
      }
    }

    if (sourceHandle.kind === 'file') {
      const file = await sourceHandle.getFile();

      const newFileHandle = await destinationDirHandle.getFileHandle(newName, {
        create: true,
      });
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      await this.delete(normalizedOld, false);
    } else {
      throw new VfsError(
        FileSystemError.NotSupported,
        'Directory rename is not supported in this browser version (requires FileSystemHandle.move)',
      );
    }

    this.events.emit({
      type: 'rename',
      path: normalizedOld,
      newPath: normalizedNew,
    });
  }

  public watch(callback: (event: VfsEvent) => void): () => void {
    return this.events.subscribe(callback);
  }
}
