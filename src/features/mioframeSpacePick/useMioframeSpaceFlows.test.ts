/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- DOM File System Access API mocks need structural casting in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { isCreateMioframeSpaceFieldError, useCreateMioframeSpace } from './useCreateMioframeSpace';
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

type MockDirectoryHandle = FileSystemDirectoryHandle & {
  getDirectoryHandleMock: ReturnType<typeof vi.fn>;
};

const markerFileName = storageAdapterMarkerFileName;

const createFileHandle = (name: string): FileSystemFileHandle =>
  ({
    kind: 'file',
    name,
    isSameEntry: vi.fn(() => Promise.resolve(false)),
    createWritable: vi.fn(),
    createSyncAccessHandle: vi.fn(),
    getFile: vi.fn(),
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    queryPermission: vi.fn(() => Promise.resolve('granted')),
    isFile: true,
    isDirectory: false,
  }) as FileSystemFileHandle;

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
  const getDirectoryHandleMock = vi.fn(
    async (directoryName: string, options?: FileSystemGetDirectoryOptions) =>
      (subdirectoryFactory?.(directoryName, options) ??
        createDirectoryHandle({ name: directoryName })) as FileSystemDirectoryHandle,
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
        for (const entry of entries) {
          yield entry as [string, FileSystemDirectoryHandle | FileSystemFileHandle];
        }
      })()) as FileSystemDirectoryHandle['entries'],
    keys: (() =>
      (async function* () {
        await Promise.resolve();
        for (const [entryName] of entries) {
          yield entryName;
        }
      })()) as FileSystemDirectoryHandle['keys'],
    values: (() =>
      (async function* () {
        await Promise.resolve();
        for (const [, childHandle] of entries) {
          yield childHandle as FileSystemDirectoryHandle | FileSystemFileHandle;
        }
      })()) as FileSystemDirectoryHandle['values'],
    getDirectoryHandle: getDirectoryHandleMock,
    getDirectoryHandleMock,
    getFileHandle: vi.fn(async (fileName: string) => {
      const entry = entries.find(([entryName, childHandle]) => {
        return entryName === fileName && childHandle.kind === 'file';
      })?.[1];

      if (entry?.kind === 'file') {
        return entry as FileSystemFileHandle;
      }

      throw new DOMException('File not found', 'NotFoundError');
    }),
    getFile(fileName: string, _options?: FileSystemGetFileOptions) {
      return handle.getFileHandle(fileName);
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

const expectFieldError = async (promise: Promise<unknown>, message: string) => {
  await expect(promise).rejects.toSatisfy(
    (error: unknown) => isCreateMioframeSpaceFieldError(error) && error.fieldMessage === message,
  );
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
  });

  it('starts in editing state for the selected parent folder', () => {
    const parentHandle = createDirectoryHandle({ name: 'Documents' });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    expect(createFlow.createDialogState.value).toEqual({
      status: 'editing-name',
      selectedLocation: 'Documents',
    });
  });

  it('creates and mounts a subfolder using the submitted name', async () => {
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
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toBe(true);

    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(1, 'Work Notes');
    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(2, 'Work Notes', {
      create: true,
    });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(createdSpaceHandle);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalledWith(parentHandle);
  });

  it('throws a field error when the browser rejects the submitted folder name', async () => {
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => {
        throw new TypeError('Invalid name');
      },
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expectFieldError(
      createFlow.submitCreateSpaceName('Invalid'),
      'Enter a valid folder name.',
    );
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(createFlow.createDialogState.value).toEqual({
      status: 'editing-name',
      selectedLocation: 'Documents',
    });
  });

  it('keeps the dialog open in conflict state for an existing Mioframe subfolder', async () => {
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
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toBe(false);

    expect(confirmMock).not.toHaveBeenCalled();
    expect(createFlow.createDialogState.value).toEqual({
      status: 'existing-space-conflict',
      selectedLocation: 'Documents',
      conflictSpaceName: 'Work Notes',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('opens the existing Mioframe subfolder from conflict state', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingSpaceHandle,
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await createFlow.submitCreateSpaceName('Work Notes');
    await expect(createFlow.openExistingSpaceFromConflict()).resolves.toBe(true);

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
  });

  it('restores the same conflict state when opening an existing Mioframe subfolder fails', async () => {
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
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toBe(false);
    await expect(createFlow.openExistingSpaceFromConflict()).resolves.toBe(false);

    expect(createFlow.createDialogState.value).toEqual({
      status: 'existing-space-conflict',
      selectedLocation: 'Documents',
      conflictSpaceName: 'Work Notes',
    });
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

  it('throws a field error for an existing ordinary subfolder', async () => {
    const existingOrdinaryHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingOrdinaryHandle,
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expectFieldError(
      createFlow.submitCreateSpaceName('Work Notes'),
      'A folder with this name already exists. Choose another name.',
    );
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(createFlow.createDialogState.value).toEqual({
      status: 'editing-name',
      selectedLocation: 'Documents',
    });
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
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toBe(false);

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
});
/* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- Re-enable after DOM File System Access API test mocks. */
