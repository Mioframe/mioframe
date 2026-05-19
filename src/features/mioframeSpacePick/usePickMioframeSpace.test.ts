/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- DOM File System Access API mocks need structural casting in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { useCreateMioframeSpace } from './useCreateMioframeSpace';
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
    useCreateMioframeSpace().cancelCreateSpace();
  });

  it('shows a useful message when folder picking is unsupported', () => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: undefined,
    });

    void useCreateMioframeSpace().createSpace();

    expect(addSnackbarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Your browser does not support choosing folders for Mioframe spaces',
      }),
    );
  });

  it('starts create flow after choosing a parent folder without owning form state', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const createFlow = useCreateMioframeSpace();

    await createFlow.createSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(createFlow.createFlowState.value).toEqual({
      status: 'editing-name',
      selectedLocation: 'Documents',
    });
    expect(createFlow.hasActiveDialog.value).toBe(true);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('cancels create flow without snackbar or report', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const createFlow = useCreateMioframeSpace();

    await createFlow.createSpace();
    createFlow.cancelCreateSpace();

    expect(createFlow.createFlowState.value.status).toBe('idle');
    expect(createFlow.loading.value).toBe(false);
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('ignores repeated create starts while create flow is active', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const createFlow = useCreateMioframeSpace();

    await createFlow.createSpace();
    await createFlow.createSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('creates and mounts a subfolder using the valid name submitted by the dialog', async () => {
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

    await createFlow.createSpace();
    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toEqual({
      status: 'created',
    });

    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(1, 'Work Notes');
    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(2, 'Work Notes', {
      create: true,
    });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(createdSpaceHandle);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalledWith(parentHandle);
    expect(createFlow.createFlowState.value.status).toBe('idle');
  });

  it('returns invalid-folder-name when the browser rejects the submitted folder name', async () => {
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => {
        throw new TypeError('Invalid name');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);

    const createFlow = useCreateMioframeSpace();

    await createFlow.createSpace();
    await expect(createFlow.submitCreateSpaceName('Invalid')).resolves.toEqual({
      status: 'invalid-folder-name',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(createFlow.createFlowState.value).toEqual({
      status: 'editing-name',
      selectedLocation: 'Documents',
    });
  });

  it('returns existing-space-conflict for an existing Mioframe subfolder without global confirm', async () => {
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

    await createFlow.createSpace();
    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toEqual({
      status: 'existing-space-conflict',
    });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(createFlow.createFlowState.value).toEqual({
      status: 'existing-space-conflict',
      selectedLocation: 'Documents',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('opens existing Mioframe subfolder from explicit conflict action', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingSpaceHandle,
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);

    const createFlow = useCreateMioframeSpace();

    await createFlow.createSpace();
    await createFlow.submitCreateSpaceName('Work Notes');
    await expect(createFlow.openExistingSpaceFromConflict()).resolves.toBe(true);

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
    expect(createFlow.createFlowState.value.status).toBe('idle');
  });

  it('returns ordinary-folder-exists for an existing ordinary subfolder', async () => {
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

    await createFlow.createSpace();
    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toEqual({
      status: 'ordinary-folder-exists',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(createFlow.createFlowState.value).toEqual({
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
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);

    const createFlow = useCreateMioframeSpace();

    await createFlow.createSpace();
    await expect(createFlow.submitCreateSpaceName('Work Notes')).resolves.toEqual({
      status: 'failed',
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
});
/* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- Re-enable after DOM File System Access API test mocks. */
