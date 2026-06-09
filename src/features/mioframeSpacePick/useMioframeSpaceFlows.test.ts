/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- DOM File System Access API mocks need structural casting in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { useCreateMioframeSpace } from './useCreateMioframeSpace';
import { useMioframeSpaceParentPicker } from './useMioframeSpaceParentPicker';
import { useOpenMioframeSpace } from './useOpenMioframeSpace';

const {
  addDeviceDirectoryMock,
  addSnackbarMock,
  confirmMock,
  disconnectDeviceFileMock,
  initializeRepositoryMock,
  captureDiagnosticExceptionMock,
  showDirectoryPickerMock,
} = vi.hoisted(() => ({
  addDeviceDirectoryMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  confirmMock: vi.fn(),
  disconnectDeviceFileMock: vi.fn(),
  initializeRepositoryMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
  showDirectoryPickerMock: vi.fn(),
}));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    addDeviceDirectory: addDeviceDirectoryMock,
    disconnectDeviceFile: disconnectDeviceFileMock,
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    repositories: {
      initializeRepository: initializeRepositoryMock,
    },
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

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
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

describe('useMioframeSpaceParentPicker', () => {
  beforeEach(() => {
    addDeviceDirectoryMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    disconnectDeviceFileMock.mockReset();
    initializeRepositoryMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    showDirectoryPickerMock.mockReset();
    addDeviceDirectoryMock.mockResolvedValue(undefined);
    disconnectDeviceFileMock.mockResolvedValue(undefined);
    initializeRepositoryMock.mockResolvedValue(undefined);
    confirmMock.mockResolvedValue(false);
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('picks and resets the parent directory', async () => {
    const parentHandle = createDirectoryHandle({ name: 'Documents' });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);
    const parentPicker = useMioframeSpaceParentPicker();

    await parentPicker.pickParentDirectory();

    expect(showDirectoryPickerMock).toHaveBeenCalledWith({
      mode: 'readwrite',
    });
    expect(parentPicker.parentHandle.value).toEqual(parentHandle);

    parentPicker.resetParentDirectory();

    expect(parentPicker.parentHandle.value).toBeUndefined();
  });

  it('reports a privacy-safe error when parent-folder picking fails unexpectedly', async () => {
    showDirectoryPickerMock.mockRejectedValueOnce(new Error('raw picker detail'));
    const parentPicker = useMioframeSpaceParentPicker();

    await parentPicker.pickParentDirectory();

    expect(parentPicker.parentHandle.value).toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not create the Mioframe space',
        cause: expect.objectContaining({
          message: 'Creating the Mioframe space failed',
        }),
      }),
      {
        feature: 'mioframeSpaceCreate',
        action: 'pickParentFolder',
      },
    );
  });
});

describe('useCreateMioframeSpace', () => {
  beforeEach(() => {
    addDeviceDirectoryMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    disconnectDeviceFileMock.mockReset();
    initializeRepositoryMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    showDirectoryPickerMock.mockReset();
    addDeviceDirectoryMock.mockResolvedValue({
      name: 'Work Notes',
      handle: undefined,
    });
    disconnectDeviceFileMock.mockResolvedValue(undefined);
    initializeRepositoryMock.mockResolvedValue(undefined);
    confirmMock.mockResolvedValue(false);
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('creates, mounts, and initializes a new space through the mounted VFS path', async () => {
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

    await expect(
      createFlow.checkCreateSpaceNameAvailability('Work Notes'),
    ).resolves.toBeUndefined();
    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(true);

    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(1, 'Work Notes');
    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(2, 'Work Notes');
    expect(parentHandle.getDirectoryHandleMock).toHaveBeenNthCalledWith(3, 'Work Notes', {
      create: true,
    });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(createdSpaceHandle);
    expect(initializeRepositoryMock).toHaveBeenCalledWith('/Device Files/Work Notes');
    expect(disconnectDeviceFileMock).not.toHaveBeenCalled();
  });

  it('initializes with the mounted directory name returned from addDeviceDirectory', async () => {
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
    addDeviceDirectoryMock.mockResolvedValueOnce({
      name: 'Work Notes (2)',
      handle: createdSpaceHandle,
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(true);

    expect(initializeRepositoryMock).toHaveBeenCalledWith('/Device Files/Work Notes (2)');
    expect(initializeRepositoryMock).not.toHaveBeenCalledWith('/Device Files/Work Notes');
  });

  it('does not touch the filesystem for an invalid name', async () => {
    const parentHandle = createDirectoryHandle({ name: 'Documents' });
    useCreateMioframeSpace(ref(parentHandle));

    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(parentHandle.getDirectoryHandleMock).not.toHaveBeenCalled();
  });

  it('returns a text field issue for an existing ordinary subfolder', async () => {
    const existingOrdinaryHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingOrdinaryHandle,
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.checkCreateSpaceNameAvailability('Work Notes')).resolves.toEqual({
      message: 'A folder with this name already exists. Choose another name.',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('returns an existing-space field issue and can open that space', async () => {
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

    await expect(createFlow.checkCreateSpaceNameAvailability('Work Notes')).resolves.toEqual({
      message:
        'A Mioframe space with this name already exists here. Open the existing space, or choose another name.',
      existingSpace: {
        normalizedName: 'Work Notes',
        handle: existingSpaceHandle,
      },
    });
    await expect(createFlow.openExistingSpace(existingSpaceHandle)).resolves.toBe(true);
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
  });

  it('re-checks before create and refuses to initialize an ordinary folder that appeared after availability passed', async () => {
    const existingOrdinaryHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    let targetExists = false;
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: (directoryName, options) => {
        if (directoryName !== 'Work Notes') {
          throw new DOMException('Missing directory', 'NotFoundError');
        }

        if (options?.create) {
          throw new Error('create should not run for a stale ordinary-folder conflict');
        }

        if (!targetExists) {
          throw new DOMException('Missing directory', 'NotFoundError');
        }

        return existingOrdinaryHandle;
      },
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));
    await expect(
      createFlow.checkCreateSpaceNameAvailability('Work Notes'),
    ).resolves.toBeUndefined();

    targetExists = true;

    await expect(createFlow.createSpace('Work Notes')).resolves.toEqual({
      message: 'A folder with this name already exists. Choose another name.',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(initializeRepositoryMock).not.toHaveBeenCalled();
  });

  it('re-checks before create and returns an existing-space issue when a Mioframe folder appeared after availability passed', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    let targetExists = false;
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: (directoryName, options) => {
        if (directoryName !== 'Work Notes') {
          throw new DOMException('Missing directory', 'NotFoundError');
        }

        if (options?.create) {
          throw new Error('create should not run for a stale existing-space conflict');
        }

        if (!targetExists) {
          throw new DOMException('Missing directory', 'NotFoundError');
        }

        return existingSpaceHandle;
      },
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));
    await expect(
      createFlow.checkCreateSpaceNameAvailability('Work Notes'),
    ).resolves.toBeUndefined();

    targetExists = true;

    await expect(createFlow.createSpace('Work Notes')).resolves.toEqual({
      message:
        'A Mioframe space with this name already exists here. Open the existing space, or choose another name.',
      existingSpace: {
        normalizedName: 'Work Notes',
        handle: existingSpaceHandle,
      },
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(initializeRepositoryMock).not.toHaveBeenCalled();
  });

  it('reports a privacy-safe error when opening an existing conflicted space fails', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingSpaceHandle,
    });
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.checkCreateSpaceNameAvailability('Work Notes')).resolves.toEqual({
      message:
        'A Mioframe space with this name already exists here. Open the existing space, or choose another name.',
      existingSpace: {
        normalizedName: 'Work Notes',
        handle: existingSpaceHandle,
      },
    });
    await expect(createFlow.openExistingSpace(existingSpaceHandle)).resolves.toBe(false);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not open the Mioframe space',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not open the Mioframe space',
        cause: expect.objectContaining({
          message: 'Opening the Mioframe space failed',
        }),
      }),
      {
        feature: 'mioframeSpaceCreate',
        action: 'openExistingSpace',
      },
    );
  });

  it('rolls back the mounted record when repository initialization fails after mounting', async () => {
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
    addDeviceDirectoryMock.mockResolvedValueOnce({
      name: 'Work Notes',
      handle: createdSpaceHandle,
    });
    initializeRepositoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(false);
    expect(disconnectDeviceFileMock).toHaveBeenCalledWith('Work Notes');
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
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
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        path: expect.anything(),
        normalizedName: expect.anything(),
      }),
    );
  });

  it('reports a privacy-safe error when rollback after repository initialization failure fails', async () => {
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
    addDeviceDirectoryMock.mockResolvedValueOnce({
      name: 'Work Notes',
      handle: createdSpaceHandle,
    });
    initializeRepositoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    disconnectDeviceFileMock.mockRejectedValueOnce(new Error('raw rollback detail'));
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(false);

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not roll back failed Mioframe space creation',
        cause: expect.objectContaining({
          message: 'Rolling back failed Mioframe space creation failed',
        }),
      }),
      {
        feature: 'mioframeSpaceCreate',
        action: 'rollbackCreateSpaceMount',
      },
    );
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
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

    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(false);
    expect(initializeRepositoryMock).not.toHaveBeenCalled();
    expect(disconnectDeviceFileMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
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

  it('returns false after reporting a privacy-safe error when availability inspection fails unexpectedly', async () => {
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => {
        throw new Error('raw filesystem detail');
      },
    });
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.checkCreateSpaceNameAvailability('Work Notes')).resolves.toBe(false);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
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
    disconnectDeviceFileMock.mockReset();
    initializeRepositoryMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    showDirectoryPickerMock.mockReset();
    addDeviceDirectoryMock.mockResolvedValue({
      name: 'Work Notes',
      handle: undefined,
    });
    disconnectDeviceFileMock.mockResolvedValue(undefined);
    initializeRepositoryMock.mockResolvedValue(undefined);
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
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(
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
