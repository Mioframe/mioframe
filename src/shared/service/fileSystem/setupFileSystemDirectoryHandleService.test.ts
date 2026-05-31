import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

const { observableMock, setMock } = vi.hoisted(() => ({
  observableMock: vi.fn(),
  setMock: vi.fn(),
}));

vi.mock('@shared/lib/observableIDB', () => ({
  ObservableIDB: class {
    observable() {
      return observableMock();
    }

    set(value: unknown) {
      return setMock(value);
    }
  },
}));

const createDirectoryHandle = (name: string): FileSystemDirectoryHandle => ({
  kind: 'directory',
  name,
  isSameEntry: vi.fn(() => Promise.resolve(false)),
  requestPermission: vi.fn<
    (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
  >(() => Promise.resolve('granted')),
  queryPermission: vi.fn<
    (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
  >(() => Promise.resolve('granted')),
  isFile: false,
  isDirectory: true,
  entries: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
  getDirectoryHandle: vi.fn(),
  getFileHandle: vi.fn(),
  removeEntry: vi.fn(),
  resolve: vi.fn(),
  getFile(fileName: string, options?: FileSystemGetFileOptions) {
    return this.getFileHandle(fileName, options);
  },
  getDirectory(directoryName: string, options?: FileSystemGetDirectoryOptions) {
    return this.getDirectoryHandle(directoryName, options);
  },
  getEntries() {
    return this.values();
  },
  [Symbol.asyncIterator]() {
    return this.entries();
  },
});

describe('setupFileSystemDirectoryHandleService', () => {
  beforeEach(() => {
    observableMock.mockReset();
    setMock.mockReset();
    vi.resetModules();
  });

  it('drops legacy descriptions from normalized persisted records', async () => {
    const handle = createDirectoryHandle('Archive');
    observableMock.mockReturnValue(
      new BehaviorSubject({
        success: true as const,
        data: [
          {
            description: 'Directory on this device',
            name: 'Archive',
            handle,
          },
        ],
      }),
    );

    const { useFileSystemDirectoryHandleService } =
      await import('./setupFileSystemDirectoryHandleService');

    await expect(useFileSystemDirectoryHandleService().getRecordList()).resolves.toEqual([
      {
        name: 'Archive',
        handle,
      },
    ]);
  });

  it('persists only normalized name and handle fields', async () => {
    const handle = createDirectoryHandle('Archive');
    observableMock.mockReturnValue(
      new BehaviorSubject({
        success: true as const,
        data: [],
      }),
    );
    setMock.mockResolvedValue(undefined);

    const { useFileSystemDirectoryHandleService } =
      await import('./setupFileSystemDirectoryHandleService');

    await useFileSystemDirectoryHandleService().updateRecordList([
      {
        name: 'Archive',
        handle,
      },
    ]);

    expect(setMock).toHaveBeenCalledWith([
      {
        name: 'Archive',
        handle,
      },
    ]);
  });

  it('returns an empty list when persisted storage reports invalid data', async () => {
    observableMock.mockReturnValue(
      new BehaviorSubject({
        success: false as const,
        error: new Error('invalid'),
      }),
    );

    const { useFileSystemDirectoryHandleService } =
      await import('./setupFileSystemDirectoryHandleService');

    await expect(useFileSystemDirectoryHandleService().getRecordList()).resolves.toEqual([]);
  });

  it('ignores null storage emissions before returning the first record list', async () => {
    const handle = createDirectoryHandle('Archive');
    const subject = new BehaviorSubject<null | {
      success: true;
      data: Array<{
        description?: string | undefined;
        handle: FileSystemDirectoryHandle;
        name: string;
      }>;
    }>(null);
    observableMock.mockReturnValue(subject);

    const { useFileSystemDirectoryHandleService } =
      await import('./setupFileSystemDirectoryHandleService');

    const pendingRecords = useFileSystemDirectoryHandleService().getRecordList();
    subject.next({
      success: true,
      data: [
        {
          description: 'Directory on this device',
          name: 'Archive',
          handle,
        },
      ],
    });

    await expect(pendingRecords).resolves.toEqual([
      {
        name: 'Archive',
        handle,
      },
    ]);
  });
});
