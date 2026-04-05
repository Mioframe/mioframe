import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
  VfsEvent,
  WriteOptions,
} from '../virtualFileSystem';
import {
  EventEmitter,
  FileSystemError,
  FSNodeType,
  PathUtils,
  VfsEventSource,
  VfsError,
  VirtualFileSystem,
  VfsEventType,
} from '../virtualFileSystem';
import { WebFileSystemProvider } from '../webFileSystemProvider';

export const DEVICE_FILES_ROOT_NAME = 'Device Files';

export interface DeviceFileRecord {
  name: string;
  handle: FileSystemDirectoryHandle;
}

interface ActiveDeviceFileRecord extends DeviceFileRecord {
  provider: IFileSystemProvider;
}

export interface DeviceFileSystemProviderOptions {
  createProvider?: (handle: FileSystemDirectoryHandle) => IFileSystemProvider;
}

export interface DeviceFileSystemProvider extends IFileSystemProvider {
  listRecords(): DeviceFileRecord[];
  upsertRecord(record: DeviceFileRecord): void;
  removeRecord(name: string): void;
  watch(callback: (event: VfsEvent) => void): () => void;
}

const rootDirectoryStat = {
  type: FSNodeType.Directory,
  canDelete: false,
} satisfies FSNodeStat;

const isMountedRootPath = (path: string) => PathUtils.split(path).length <= 1;

const resolveRecordForWrite = (
  path: string,
  records: Map<string, ActiveDeviceFileRecord>,
) => {
  const [rootName, ...relativePath] = PathUtils.split(path);
  const record = rootName ? records.get(rootName) : undefined;

  if (!record) {
    throw new VfsError(
      FileSystemError.FileNotFound,
      `Directory not found: ${path}`,
    );
  }

  return {
    record,
    relativePath: PathUtils.join('/', ...relativePath),
  };
};

export const DeviceFileSystemProvider = ({
  createProvider = WebFileSystemProvider,
}: DeviceFileSystemProviderOptions = {}): DeviceFileSystemProvider => {
  const vfs = new VirtualFileSystem();
  const events = new EventEmitter();
  const records = new Map<string, ActiveDeviceFileRecord>();

  const listRecords = (): DeviceFileRecord[] =>
    Array.from(records.values(), ({ handle, name }) => ({
      name,
      handle,
    }));

  const upsertRecord = (record: DeviceFileRecord): void => {
    const existingRecord = records.get(record.name);
    const provider =
      existingRecord?.handle === record.handle
        ? existingRecord.provider
        : createProvider(record.handle);

    records.set(record.name, {
      ...record,
      provider,
    });

    vfs.mount(PathUtils.join('/', record.name), provider);

    if (!existingRecord) {
      events.emit({
        source: VfsEventSource.PROVIDER,
        type: VfsEventType.CREATE,
        path: PathUtils.join('/', record.name),
        nodeType: FSNodeType.Directory,
      });
    }
  };

  const removeRecord = (name: string): void => {
    const normalizedName = PathUtils.basename(name);
    const existingRecord = records.get(normalizedName);

    if (!existingRecord) {
      return;
    }

    records.delete(normalizedName);
    vfs.unmount(PathUtils.join('/', normalizedName));
    events.emit({
      source: VfsEventSource.PROVIDER,
      type: VfsEventType.DELETE,
      path: PathUtils.join('/', normalizedName),
      nodeType: FSNodeType.Directory,
    });
  };

  const watch = (callback: (event: VfsEvent) => void) =>
    events.subscribe(callback);

  const stat = async (path: string): Promise<FSNodeStat> => {
    const normalizedPath = PathUtils.normalize(path);

    if (normalizedPath === '/') {
      return rootDirectoryStat;
    }

    return vfs.stat(normalizedPath);
  };

  const readFile = async (path: string): Promise<File> => {
    const normalizedPath = PathUtils.normalize(path);

    if (isMountedRootPath(normalizedPath)) {
      throw new VfsError(
        FileSystemError.FileIsADirectory,
        `Cannot read directory: ${normalizedPath}`,
      );
    }

    return vfs.readFile(normalizedPath);
  };

  const writeFile = async (
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<void> => {
    const normalizedPath = PathUtils.normalize(path);

    if (isMountedRootPath(normalizedPath)) {
      throw new VfsError(
        FileSystemError.NotSupported,
        `Cannot create files at root path: ${normalizedPath}`,
      );
    }

    const { record, relativePath } = resolveRecordForWrite(
      normalizedPath,
      records,
    );

    return record.provider.writeFile(relativePath, content, options);
  };

  const readDirectory = async (
    path: string,
  ): Promise<[string, FSNodeStat][]> => {
    const normalizedPath = PathUtils.normalize(path);

    if (normalizedPath === '/') {
      return listRecords().map(({ name }): [string, FSNodeStat] => [
        name,
        rootDirectoryStat,
      ]);
    }

    return vfs.readDirectory(normalizedPath);
  };

  const createDirectory = async (path: string): Promise<void> => {
    const normalizedPath = PathUtils.normalize(path);

    if (isMountedRootPath(normalizedPath)) {
      throw new VfsError(
        FileSystemError.NotSupported,
        `Cannot create mounted roots at: ${normalizedPath}`,
      );
    }

    return vfs.createDirectory(normalizedPath);
  };

  const remove = async (path: string, recursive: boolean): Promise<void> => {
    const normalizedPath = PathUtils.normalize(path);

    if (normalizedPath === '/') {
      throw new VfsError(
        FileSystemError.NoPermissions,
        'Cannot delete Device Files root',
      );
    }

    return vfs.delete(normalizedPath, recursive);
  };

  const move = async (oldPath: string, newPath: string): Promise<void> => {
    const normalizedOldPath = PathUtils.normalize(oldPath);
    const normalizedNewPath = PathUtils.normalize(newPath);

    if (
      isMountedRootPath(normalizedOldPath) ||
      isMountedRootPath(normalizedNewPath)
    ) {
      throw new VfsError(
        FileSystemError.NotSupported,
        `Cannot move mounted roots: ${oldPath} -> ${newPath}`,
      );
    }

    return vfs.move(normalizedOldPath, normalizedNewPath);
  };

  return {
    listRecords,
    upsertRecord,
    removeRecord,
    watch,
    stat,
    readFile,
    writeFile,
    readDirectory,
    createDirectory,
    delete: remove,
    move,
  };
};
