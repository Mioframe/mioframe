/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- DOM File System Access API mocks need structural casting in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePickMioframeSpace } from './usePickMioframeSpace';

const {
  addDeviceDirectoryMock,
  addSnackbarMock,
  alertMock,
  confirmMock,
  reportHandledErrorMock,
  showDirectoryPickerMock,
} = vi.hoisted(() => ({
  addDeviceDirectoryMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  alertMock: vi.fn(),
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
    alert: alertMock,
    confirm: confirmMock,
  }),
}));

vi.mock('@shared/lib/reportHandledError', () => ({
  reportHandledError: reportHandledErrorMock,
}));

type MockDirectoryHandle = FileSystemDirectoryHandle & {
  getDirectoryHandleMock: ReturnType<typeof vi.fn>;
};

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
        createDirectoryHandle({
          name: directoryName,
        })) as FileSystemDirectoryHandle,
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
    getFileHandle: vi.fn(async (fileName: string, _options?: FileSystemGetFileOptions) => {
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

describe('usePickMioframeSpace', () => {
  beforeEach(() => {
    addDeviceDirectoryMock.mockReset();
    addSnackbarMock.mockReset();
    alertMock.mockReset();
    confirmMock.mockReset();
    reportHandledErrorMock.mockReset();
    showDirectoryPickerMock.mockReset();
    addDeviceDirectoryMock.mockResolvedValue(undefined);
    alertMock.mockResolvedValue(true);
    confirmMock.mockResolvedValue(false);
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
    usePickMioframeSpace().cancelCreateSpace();
  });

  it('shows a useful message when create space is unsupported', () => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: undefined,
    });

    const { createSpace } = usePickMioframeSpace();

    void createSpace();

    expect(addSnackbarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Your browser does not support choosing folders for Mioframe spaces',
      }),
    );
  });

  it('opens MDN details from the unsupported message callback', () => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: undefined,
    });
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const { openSpace } = usePickMioframeSpace();

    void openSpace();

    const snackbar = addSnackbarMock.mock.calls[0]?.[0];
    expect(snackbar).toBeDefined();
    snackbar?.callback?.();
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker',
      '_blank',
    );
  });

  it('does not show an error when the system picker is cancelled', async () => {
    showDirectoryPickerMock.mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('does not open multiple pickers while loading', async () => {
    let resolvePicker: ((handle: FileSystemDirectoryHandle) => void) | undefined;
    showDirectoryPickerMock.mockImplementationOnce(
      () =>
        new Promise<FileSystemDirectoryHandle>((resolve) => {
          resolvePicker = resolve;
        }),
    );

    const { createSpace } = usePickMioframeSpace();
    const firstPromise = createSpace();
    const secondPromise = createSpace();

    resolvePicker?.(createDirectoryHandle({ name: 'Parent' }));
    await Promise.all([firstPromise, secondPromise]);

    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
  });

  it('create space asks for a space name after choosing parent folder', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const picker = usePickMioframeSpace();

    await picker.createSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(picker.createFlowState.value).toMatchObject({
      status: 'editing-name',
      selectedLocation: 'Documents',
      resultFolder: 'Documents / <space name>',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space does not prefill Mioframe as the default name', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const picker = usePickMioframeSpace();

    await picker.createSpace();

    expect(picker.createFlowState.value).toMatchObject({
      status: 'editing-name',
      spaceName: undefined,
    });
  });

  it('create space cancel returns to a stable idle state without snackbar or error', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.cancelCreateSpace();

    expect(picker.createFlowState.value.status).toBe('idle');
    expect(picker.loading.value).toBe(false);
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('create space requires a non-empty name', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('   ');
    await picker.submitCreateSpace();

    expect(picker.createFlowState.value).toMatchObject({
      status: 'editing-name',
      errorText: 'Enter a space name.',
    });
    expect(picker.loading.value).toBe(false);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space rejects invalid folder names', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work / Notes');
    await picker.submitCreateSpace();

    expect(picker.createFlowState.value).toMatchObject({
      status: 'editing-name',
      errorText: 'Enter a valid folder name.',
    });
    expect(picker.loading.value).toBe(false);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space creates a subfolder inside the selected parent folder', async () => {
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

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work Notes');
    await picker.submitCreateSpace();

    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(1, 'Work Notes');
    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(2, 'Work Notes', {
      create: true,
    });
  });

  it('create space mounts the created subfolder, not the selected parent folder', async () => {
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

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work Notes');
    await picker.submitCreateSpace();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(createdSpaceHandle);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalledWith(parentHandle);
    expect(picker.createFlowState.value.status).toBe('idle');
  });

  it('create space with Documents and Work Notes mounts Documents / Work Notes', async () => {
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

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work Notes');
    expect(picker.createFlowState.value).toMatchObject({
      status: 'editing-name',
      resultFolder: 'Documents / Work Notes',
    });
    await picker.submitCreateSpace();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(createdSpaceHandle);
    expect(picker.loading.value).toBe(false);
  });

  it('create space shows existing Mioframe subfolder conflict inside the flow', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
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

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work Notes');
    await picker.submitCreateSpace();

    expect(confirmMock).not.toHaveBeenCalled();
    expect(picker.createFlowState.value).toMatchObject({
      status: 'existing-space-conflict',
      selectedLocation: 'Documents',
      resultFolder: 'Documents / Work Notes',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space opens existing Mioframe subfolder after explicit conflict action', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
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

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work Notes');
    await picker.submitCreateSpace();
    await picker.openExistingSpaceFromConflict();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
    expect(picker.createFlowState.value.status).toBe('idle');
  });

  it('create space rejects existing ordinary subfolder and keeps the name form open', async () => {
    const existingOrdinaryHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: (directoryName) => {
        if (directoryName === 'Work Notes') {
          return existingOrdinaryHandle;
        }

        throw new DOMException('Missing directory', 'NotFoundError');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work Notes');
    await picker.submitCreateSpace();

    expect(picker.createFlowState.value).toMatchObject({
      status: 'editing-name',
      errorText: 'A folder with this name already exists. Choose another name.',
      selectedLocation: 'Documents',
      resultFolder: 'Documents / Work Notes',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
  });

  it('open space does not mount ordinary folder', async () => {
    const ordinaryHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(ordinaryHandle);
    confirmMock.mockResolvedValueOnce(false);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('open space offers Choose another folder and Cancel when no space is found', async () => {
    const ordinaryHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(ordinaryHandle);
    confirmMock.mockResolvedValueOnce(false);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'No Mioframe space found',
      supportingText: 'Choose a folder where a Mioframe space has already been created.',
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });
  });

  it('open space retries picker after Choose another folder', async () => {
    const ordinaryHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
    });
    showDirectoryPickerMock
      .mockResolvedValueOnce(ordinaryHandle)
      .mockResolvedValueOnce(existingSpaceHandle);
    confirmMock.mockResolvedValueOnce(true);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(2);
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
  });

  it('open space cancel returns to stable state without snackbar or error', async () => {
    const ordinaryHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(ordinaryHandle);
    confirmMock.mockResolvedValueOnce(false);

    const picker = usePickMioframeSpace();

    await picker.openSpace();

    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
    expect(picker.loading.value).toBe(false);
  });

  it('open space opens the system directory picker directly for an existing Mioframe space', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Space',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(existingSpaceHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
  });

  it('reports a privacy-safe error when opening a selected folder fails', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Existing Space',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
    });
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    showDirectoryPickerMock.mockResolvedValueOnce(existingSpaceHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

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
        feature: 'mioframeSpacePick',
        action: 'openSpace',
      },
    );
  });

  it('reports a privacy-safe error when creating a selected folder fails', async () => {
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

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Work Notes');
    await picker.submitCreateSpace();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    expect(picker.loading.value).toBe(false);
    expect(reportHandledErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not create the Mioframe space',
        cause: expect.objectContaining({
          message: 'Creating the Mioframe space failed',
        }),
      }),
      {
        feature: 'mioframeSpacePick',
        action: 'createSpace',
      },
    );
  });

  it('reports a privacy-safe error when marker inspection fails unexpectedly during open', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Protected Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    selectedHandle.getFileHandle = vi.fn(async () => {
      throw new DOMException('permission denied: Protected Space', 'SecurityError');
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
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
        feature: 'mioframeSpacePick',
        action: 'openSpace',
      },
    );
    const [reportedError] = reportHandledErrorMock.mock.calls.at(-1) ?? [];
    expect(reportedError).toBeInstanceOf(Error);
    expect(reportedError).toMatchObject({
      message: 'Could not open the Mioframe space',
      cause: expect.objectContaining({
        message: 'Opening the Mioframe space failed',
      }),
    });
    expect(reportedError).not.toBeInstanceOf(DOMException);
  });

  it('reports a privacy-safe error when marker inspection fails unexpectedly during create', async () => {
    const existingSpaceHandle = createDirectoryHandle({ name: 'Protected Space' });
    existingSpaceHandle.getFileHandle = vi.fn(async () => {
      throw new DOMException('permission denied: Protected Space', 'SecurityError');
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: (directoryName) => {
        if (directoryName === 'Protected Space') {
          return existingSpaceHandle;
        }

        throw new DOMException('Missing directory', 'NotFoundError');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);

    const picker = usePickMioframeSpace();

    await picker.createSpace();
    picker.updateCreateSpaceName('Protected Space');
    await picker.submitCreateSpace();

    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
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
        feature: 'mioframeSpacePick',
        action: 'createSpace',
      },
    );
    const [reportedError] = reportHandledErrorMock.mock.calls.at(-1) ?? [];
    expect(reportedError).toBeInstanceOf(Error);
    expect(reportedError).toMatchObject({
      message: 'Could not create the Mioframe space',
      cause: expect.objectContaining({
        message: 'Creating the Mioframe space failed',
      }),
    });
    expect(reportedError).not.toBeInstanceOf(DOMException);
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- Re-enable after DOM File System Access API test mocks. */
