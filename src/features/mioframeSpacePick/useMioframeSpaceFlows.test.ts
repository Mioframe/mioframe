/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- DOM File System Access API mocks need structural casting in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { useCreateMioframeSpace } from './useCreateMioframeSpace';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { useOpenMioframeSpace } from './useOpenMioframeSpace';

const {
  addDeviceDirectoryMock,
  addSnackbarMock,
  confirmMock,
  reportHandledErrorMock,
  showDirectoryPickerMock,
} = vi.hoisted(() => ({
  addDeviceDirectoryMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  confirmMock: vi.fn(),
  reportHandledErrorMock: vi.fn(),
  showDirectoryPickerMock: vi.fn(),
}));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    addDeviceDirectory: addDeviceDirectoryMock,
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

vi.mock('@shared/ui/Dialog', () => ({
  useDialog: () => ({
    confirm: confirmMock,
  }),
}));

vi.mock('@shared/lib/reportHandledError', () => ({
  reportHandledError: reportHandledErrorMock,
}));

type MockFileHandle = FileSystemFileHandle & {
  createWritableMock: ReturnType<typeof vi.fn>;
};

type MockDirectoryHandle = FileSystemDirectoryHandle & {
  getDirectoryHandleMock: ReturnType<typeof vi.fn>;
  getFileHandleMock: ReturnType<typeof vi.fn>;
};

const markerFileName = storageAdapterMarkerFileName;

const createFileHandle = (name: string): MockFileHandle => {
  const writable = {
    close: vi.fn(() => Promise.resolve()),
    write: vi.fn(() => Promise.resolve()),
    seek: vi.fn(() => Promise.resolve()),
    truncate: vi.fn(() => Promise.resolve()),
  } as unknown as FileSystemWritableFileStream;
  const createWritableMock = vi.fn(() => Promise.resolve(writable));

  return {
    kind: 'file',
    name,
    isSameEntry: vi.fn(() => Promise.resolve(false)),
    createWritable: createWritableMock,
    createSyncAccessHandle: vi.fn(),
    getFile: vi.fn(),
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    queryPermission: vi.fn(() => Promise.resolve('granted')),
    isFile: true,
    isDirectory: false,
    createWritableMock,
  } as MockFileHandle;
};

const createDirectoryHandle = ({
  name,
  entries = [],
  subdirectoryFactory,
}: {
  name: string;
  entries?: Array<[string, FileSystemHandle]>;
  subdirectoryFactory?:
    | ((directoryName: string, options?: FileSystemGetDirectoryOptions) => unknown)
    | undefined;
}): MockDirectoryHandle => {
  const entryMap = new Map(entries);
  const getDirectoryHandleMock = vi.fn(
    async (directoryName: string, options?: FileSystemGetDirectoryOptions) =>
      (subdirectoryFactory?.(directoryName, options) ??
        createDirectoryHandle({ name: directoryName })) as FileSystemDirectoryHandle,
  );
  const getFileHandleMock = vi.fn(
    async (fileName: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle> => {
      const existingEntry = entryMap.get(fileName);

      if (existingEntry?.kind === 'file') {
        return existingEntry as FileSystemFileHandle;
      }

      if (options?.create) {
        const fileHandle = createFileHandle(fileName);
        entryMap.set(fileName, fileHandle);
        return fileHandle;
      }

      throw new DOMException('File not found', 'NotFoundError');
    },
  );

  const handle = {
    kind: 'directory',
    name,
    isSameEntry: vi.fn(() => Promise.resolve(false)),
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    queryPermission: vi.fn(() => Promise.resolve('granted')),
    isFile: false,
    isDirectory: true,
    entries: (() =>
      (async function* () {
        await Promise.resolve();
        for (const entry of entryMap.entries()) {
          yield entry as [string, FileSystemDirectoryHandle | FileSystemFileHandle];
        }
      })()) as FileSystemDirectoryHandle['entries'],
    keys: (() =>
      (async function* () {
        await Promise.resolve();
        for (const [entryName] of entryMap.entries()) {
          yield entryName;
        }
      })()) as FileSystemDirectoryHandle['keys'],
    values: (() =>
      (async function* () {
        await Promise.resolve();
        for (const [, childHandle] of entryMap.entries()) {
          yield childHandle as FileSystemDirectoryHandle | FileSystemFileHandle;
        }
      })()) as FileSystemDirectoryHandle['values'],
    getDirectoryHandle: getDirectoryHandleMock,
    getDirectoryHandleMock,
    getFileHandle: getFileHandleMock,
    getFileHandleMock,
    getFile(fileName: string, options?: FileSystemGetFileOptions) {
      return handle.getFileHandle(fileName, options);
    },
    getDirectory(directoryName: string, options?: FileSystemGetDirectoryOptions) {
      return handle.getDirectoryHandle(directoryName, options);
    },
    getEntries() {
      return handle.values();
    },
    removeEntry: vi.fn(),
    resolve: vi.fn(),
    [Symbol.asyncIterator]() {
      return handle.entries();
    },
  };

  return handle as unknown as MockDirectoryHandle;
};

describe('useCreateMioframeSpace', () => {
  beforeEach(() => {
    addDeviceDirectoryMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    reportHandledErrorMock.mockReset();
    showDirectoryPickerMock.mockReset();
    addDeviceDirectoryMock.mockResolvedValue(undefined);
    confirmMock.mockResolvedValue(false);
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('picks the parent directory inside the create flow', async () => {
    const parentHandle = createDirectoryHandle({ name: 'Documents' });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    const createFlow = useCreateMioframeSpace();

    await createFlow.pickParentDirectory();

    expect(showDirectoryPickerMock).toHaveBeenCalledWith({
      mode: 'readwrite',
    });
    expect(createFlow.parentHandle.value).toEqual(parentHandle);
  });

  it('creates, initializes, and mounts a new space, then returns an explicit created result', async () => {
    const createdSpaceHandle = createDirectoryHandle({ name: 'Work Notes' });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: (directoryName, options) => {
        if (directoryName === 'Work Notes' && options?.create) {
          return createdSpaceHandle;
        }

        throw new DOMException('Missing directory', 'NotFoundError');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    const createFlow = useCreateMioframeSpace();

    await createFlow.pickParentDirectory();

    await expect(createFlow.submitCreateSpaceName('  Work Notes  ')).resolves.toEqual({
      status: 'created',
    });

    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(1, 'Work Notes');
    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(2, 'Work Notes', {
      create: true,
    });
    expect(createdSpaceHandle.getFileHandleMock).toHaveBeenCalledWith(markerFileName, {
      create: true,
    });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(createdSpaceHandle);
    await expect(inspectMioframeSpaceDirectory(createdSpaceHandle)).resolves.toEqual({
      looksLikeExistingSpace: true,
    });
  });

  it('returns a field-error result for an invalid name and does not mount anything', async () => {
    const parentHandle = createDirectoryHandle({ name: 'Documents' });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    const createFlow = useCreateMioframeSpace();

    await createFlow.pickParentDirectory();

    await expect(createFlow.submitCreateSpaceName('   ')).resolves.toEqual({
      status: 'field-error',
      fieldMessage: 'Enter a space name.',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(parentHandle.getDirectoryHandleMock).not.toHaveBeenCalled();
  });

  it('returns a field-error result for an existing ordinary subfolder and does not mount it', async () => {
    const existingOrdinaryHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingOrdinaryHandle,
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    const createFlow = useCreateMioframeSpace();

    await createFlow.pickParentDirectory();

    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toEqual({
      status: 'field-error',
      fieldMessage: 'A folder with this name already exists. Choose another name.',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('returns self-contained conflict state for an existing Mioframe subfolder and opens it', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: (directoryName) => {
        if (directoryName === 'Work Notes') {
          return existingSpaceHandle;
        }

        throw new DOMException('Missing directory', 'NotFoundError');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    const createFlow = useCreateMioframeSpace();

    await createFlow.pickParentDirectory();

    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toEqual({
      status: 'existing-space-conflict',
      selectedLocation: 'Documents',
      submittedSpaceName: 'Work Notes',
      targetHandle: existingSpaceHandle,
    });
    await expect(createFlow.openExistingSpaceFromConflict()).resolves.toEqual({
      status: 'opened-existing-space',
    });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
  });

  it('restores the same conflict state when opening an existing Mioframe subfolder fails', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingSpaceHandle,
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    const createFlow = useCreateMioframeSpace();

    await createFlow.pickParentDirectory();
    const conflictResult = await createFlow.submitCreateSpaceName('Work Notes');
    const openResult = await createFlow.openExistingSpaceFromConflict();

    expect(conflictResult).toEqual({
      status: 'existing-space-conflict',
      selectedLocation: 'Documents',
      submittedSpaceName: 'Work Notes',
      targetHandle: existingSpaceHandle,
    });
    expect(openResult).toEqual({
      status: 'handled-error',
    });
    expect(createFlow.conflict.value).toEqual(conflictResult);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not open the Mioframe space',
    });
    expect(reportHandledErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not open the Mioframe space',
        cause: expect.objectContaining({
          message: 'Opening the Mioframe space failed',
        }),
      }),
      {
        feature: 'mioframeSpaceCreate',
        action: 'openExistingSpaceFromConflict',
      },
    );
  });

  it('reports a privacy-safe error when create mounting fails', async () => {
    const createdSpaceHandle = createDirectoryHandle({ name: 'Work Notes' });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: (directoryName, options) => {
        if (directoryName === 'Work Notes' && options?.create) {
          return createdSpaceHandle;
        }

        throw new DOMException('Missing directory', 'NotFoundError');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    const createFlow = useCreateMioframeSpace();

    await createFlow.pickParentDirectory();

    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toEqual({
      status: 'handled-error',
    });
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    expect(reportHandledErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not create the Mioframe space',
        cause: expect.objectContaining({
          message: 'Creating the Mioframe space failed',
        }),
      }),
      {
        feature: 'mioframeSpaceCreate',
        action: 'createSpace',
      },
    );
  });
});

describe('useOpenMioframeSpace', () => {
  beforeEach(() => {
    addDeviceDirectoryMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    reportHandledErrorMock.mockReset();
    showDirectoryPickerMock.mockReset();
    addDeviceDirectoryMock.mockResolvedValue(undefined);
    confirmMock.mockResolvedValue(false);
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('opens an existing Mioframe space and does not mount an ordinary folder', async () => {
    const ordinaryHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    showDirectoryPickerMock
      .mockResolvedValueOnce(ordinaryHandle)
      .mockResolvedValueOnce(existingSpaceHandle);
    confirmMock.mockResolvedValueOnce(true);

    await useOpenMioframeSpace().openSpace();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'No Mioframe space found',
      supportingText: 'Choose a folder where a Mioframe space has already been created.',
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(2);
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalledWith(ordinaryHandle);
  });

  it('lets the user cancel after an ordinary folder without mounting it', async () => {
    const ordinaryHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(ordinaryHandle);
    confirmMock.mockResolvedValueOnce(false);

    await useOpenMioframeSpace().openSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('reports a privacy-safe error when open flow hits an unexpected picker failure', async () => {
    showDirectoryPickerMock.mockRejectedValueOnce(new Error('raw picker detail'));

    await useOpenMioframeSpace().openSpace();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not open the Mioframe space',
    });
    expect(reportHandledErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not open the Mioframe space',
        cause: expect.objectContaining({
          message: 'Opening the Mioframe space failed',
        }),
      }),
      {
        feature: 'mioframeSpaceOpen',
        action: 'openSpace',
      },
    );
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- Re-enable after DOM File System Access API test mocks. */
