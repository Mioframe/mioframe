import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
  VfsEvent,
  WriteFileResult,
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
import { createMountedWebFileSystemProvider } from '../webFileSystemProvider';

export const DEVICE_FILES_ROOT_NAME = 'Device Files';

/** Mounted provider kind used to separate local handles from browser storage. */
export type DeviceFileKind = 'browserStorage' | 'localDirectory';

/** Internal mounted device-directory descriptor. */
export interface MountedDeviceFileRecord {
  /** Stable mounted root name shown in the VFS. */
  name: string;
  /** Optional mounted root description shown in listings. */
  description?: string;
  /** Mounted root kind. */
  kind: DeviceFileKind;
  /** Browser directory handle for the mounted root. */
  handle: FileSystemDirectoryHandle;
}

/** Safe UI-facing mounted device-directory record. */
export interface DeviceFileDisplayRecord {
  /** Stable mounted root name shown in the VFS. */
  name: string;
  /** Optional mounted root description shown in listings. */
  description?: string;
  /** Whether the mounted root can be disconnected by the user. */
  canDisconnect: boolean;
}

interface ActiveDeviceFileRecord extends MountedDeviceFileRecord {
  provider: IFileSystemProvider;
}

interface MountedRootStatOptions {
  description?: string;
}

/** Factory options for the device file system provider. */
export interface DeviceFileSystemProviderOptions {
  /** Factory used to build the nested provider for a mounted directory handle. */
  createProvider?: (record: MountedDeviceFileRecord) => IFileSystemProvider;
}

/** Provider that exposes mounted device directories as VFS roots. */
export interface DeviceFileSystemProvider extends IFileSystemProvider {
  /** Lists safe mounted-root display records for UI-facing code. */
  listDisplayRecords(): DeviceFileDisplayRecord[];
  /** Adds or replaces a mounted root. */
  upsertRecord(record: MountedDeviceFileRecord): void;
  /** Removes a mounted root by name. */
  removeRecord(name: string): void;
  /** Subscribes to provider-level events. */
  watch(callback: (event: VfsEvent) => void): () => void;
}

const rootDirectoryStat = {
  type: FSNodeType.Directory,
  description: 'Directories from this device and browser storage',
  capabilities: {
    canDelete: false,
    canChangePath: false,
    canEditChildren: false,
  },
} satisfies FSNodeStat;

const isMountedRootPath = (path: string) => PathUtils.split(path).length <= 1;

const getMountedRootStat = (options: MountedRootStatOptions): FSNodeStat => {
  const { description } = options;

  return {
    type: FSNodeType.Directory,
    ...(description === undefined ? {} : { description }),
    capabilities: {
      canDelete: false,
      canChangePath: false,
      canEditChildren: true,
    },
  };
};

/**
 * Resolves the mounted record and provider-relative path for nested writes.
 * @param path - Absolute VFS path.
 * @param records - Mounted root records keyed by root name.
 * @returns Mounted record plus provider-relative path.
 */
const resolveRecordForWrite = (path: string, records: Map<string, ActiveDeviceFileRecord>) => {
  const [rootName, ...relativePath] = PathUtils.split(path);
  const record = rootName ? records.get(rootName) : undefined;

  if (!record) {
    throw new VfsError(FileSystemError.FileNotFound, 'Directory not found.');
  }

  return {
    record,
    relativePath: PathUtils.join('/', ...relativePath),
  };
};

/**
 * Creates a provider that exposes mounted device directories as top-level entries.
 * @param providerOptions - Provider factory overrides.
 * @returns Device file system provider backed by mounted nested providers.
 */
export const DeviceFileSystemProvider = (
  providerOptions: DeviceFileSystemProviderOptions = {},
): DeviceFileSystemProvider => {
  const {
    createProvider = ({ handle, kind }) =>
      createMountedWebFileSystemProvider({
        kind,
        rootHandle: handle,
      }),
  } = providerOptions;
  const vfs = new VirtualFileSystem();
  const events = new EventEmitter();
  const records = new Map<string, ActiveDeviceFileRecord>();

  const listDisplayRecords = (): DeviceFileDisplayRecord[] =>
    Array.from(records.values(), ({ description, kind, name }) => ({
      canDisconnect: kind !== 'browserStorage',
      name,
      ...(description === undefined ? {} : { description }),
    }));

  const upsertRecord = (record: MountedDeviceFileRecord): void => {
    const existingRecord = records.get(record.name);
    const provider =
      existingRecord?.handle === record.handle ? existingRecord.provider : createProvider(record);

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

  const watch = (callback: (event: VfsEvent) => void) => {
    const unsubscribeRootEvents = events.subscribe(callback);
    const unsubscribeNestedEvents = vfs.watch(callback);

    return () => {
      unsubscribeNestedEvents();
      unsubscribeRootEvents();
    };
  };

  const stat = async (path: string): Promise<FSNodeStat> => {
    const normalizedPath = PathUtils.normalize(path);

    if (normalizedPath === '/') {
      return rootDirectoryStat;
    }

    if (isMountedRootPath(normalizedPath)) {
      const rootName = PathUtils.basename(normalizedPath);
      const record = records.get(rootName);

      if (!record) {
        throw new VfsError(FileSystemError.FileNotFound, 'Directory not found.');
      }

      const rootStat = await record.provider.stat('/');

      return {
        ...rootStat,
        ...(record.description === undefined ? {} : { description: record.description }),
      };
    }

    return vfs.stat(normalizedPath);
  };

  const readFile = async (path: string): Promise<File> => {
    const normalizedPath = PathUtils.normalize(path);

    if (isMountedRootPath(normalizedPath)) {
      throw new VfsError(FileSystemError.FileIsADirectory, 'Cannot read a mounted root as a file.');
    }

    return vfs.readFile(normalizedPath);
  };

  const writeFile = async (
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<WriteFileResult> => {
    const normalizedPath = PathUtils.normalize(path);

    if (isMountedRootPath(normalizedPath)) {
      throw new VfsError(FileSystemError.NotSupported, 'Cannot create files at the mounted root.');
    }

    const { record, relativePath } = resolveRecordForWrite(normalizedPath, records);

    return record.provider.writeFile(relativePath, content, options);
  };

  const readDirectory = async (path: string): Promise<[string, FSNodeStat][]> => {
    const normalizedPath = PathUtils.normalize(path);

    if (normalizedPath === '/') {
      return Array.from(records.values(), ({ description, name }): [string, FSNodeStat] => [
        name,
        getMountedRootStat(description === undefined ? {} : { description }),
      ]);
    }

    return vfs.readDirectory(normalizedPath);
  };

  const createDirectory = async (path: string): Promise<void> => {
    const normalizedPath = PathUtils.normalize(path);

    if (isMountedRootPath(normalizedPath)) {
      throw new VfsError(FileSystemError.NotSupported, 'Cannot create mounted roots.');
    }

    return vfs.createDirectory(normalizedPath);
  };

  const remove = async (path: string, recursive: boolean): Promise<void> => {
    const normalizedPath = PathUtils.normalize(path);

    if (normalizedPath === '/') {
      throw new VfsError(FileSystemError.NoPermissions, 'Cannot delete Device Files root');
    }

    return vfs.delete(normalizedPath, recursive);
  };

  const move = async (oldPath: string, newPath: string): Promise<void> => {
    const normalizedOldPath = PathUtils.normalize(oldPath);
    const normalizedNewPath = PathUtils.normalize(newPath);

    if (isMountedRootPath(normalizedOldPath) || isMountedRootPath(normalizedNewPath)) {
      throw new VfsError(FileSystemError.NotSupported, 'Cannot move mounted roots.');
    }

    return vfs.move(normalizedOldPath, normalizedNewPath);
  };

  return {
    listDisplayRecords,
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
