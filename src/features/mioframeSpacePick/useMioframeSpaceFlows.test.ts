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

vi.mock('@shared/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/service')>();
  return {
    ...actual,
    useMainServiceClient: () => ({
      repositories: {
        initializeRepository: initializeRepositoryMock,
      },
    }),
  };
});

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

  it('reports a DomainError preserving raw picker failure as cause when parent-folder picking fails', async () => {
    const rawPickerError = new Error('raw picker detail');
    showDirectoryPickerMock.mockRejectedValueOnce(rawPickerError);
    const parentPicker = useMioframeSpaceParentPicker();

    await parentPicker.pickParentDirectory();

    expect(parentPicker.parentHandle.value).toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({ feature: 'mioframeSpaceCreate', action: 'pickParentFolder' });
    expect(reportedError).toMatchObject({
      message: 'Could not create the Mioframe space',
      code: 'mioframeSpacePick.createFailed',
    });
    expect(reportedError.cause).toBe(rawPickerError);
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

  it('reports a DomainError preserving raw mount failure as cause when opening an existing conflicted space fails', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Work Notes',
      entries: [[markerFileName, createFileHandle(markerFileName)]],
    });
    const parentHandle = createDirectoryHandle({
      name: 'Documents',
      subdirectoryFactory: () => existingSpaceHandle,
    });
    const rawMountError = new Error('raw filesystem detail');
    addDeviceDirectoryMock.mockRejectedValueOnce(rawMountError);
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
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({ feature: 'mioframeSpaceCreate', action: 'openExistingSpace' });
    expect(reportedError).toMatchObject({
      message: 'Could not open the Mioframe space',
      code: 'mioframeSpacePick.openFailed',
    });
    expect(reportedError.cause).toBe(rawMountError);
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
    const rawInitError = new Error('raw filesystem detail');
    initializeRepositoryMock.mockRejectedValueOnce(rawInitError);
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(false);
    expect(disconnectDeviceFileMock).toHaveBeenCalledWith('Work Notes');
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({ feature: 'mioframeSpaceCreate', action: 'createSpace' });
    expect(reportedError).toMatchObject({
      message: 'Could not create the Mioframe space',
      code: 'mioframeSpacePick.createFailed',
    });
    expect(reportedError.cause).toBe(rawInitError);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        path: expect.anything(),
        normalizedName: expect.anything(),
      }),
    );
  });

  it('preserves raw rollback and init errors as causes when rollback after repository initialization failure also fails', async () => {
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
    const rawInitError = new Error('raw filesystem detail');
    const rawRollbackError = new Error('raw rollback detail');
    initializeRepositoryMock.mockRejectedValueOnce(rawInitError);
    disconnectDeviceFileMock.mockRejectedValueOnce(rawRollbackError);
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(false);

    const rollbackCall = captureDiagnosticExceptionMock.mock.calls.find(
      ([, opts]) => opts?.action === 'rollbackCreateSpaceMount',
    );
    expect(rollbackCall).toBeDefined();
    expect(rollbackCall?.[0]).toMatchObject({
      message: 'Could not roll back failed Mioframe space creation',
      code: 'mioframeSpacePick.rollbackFailed',
    });
    expect(rollbackCall?.[0].cause).toBe(rawRollbackError);

    const createCall = captureDiagnosticExceptionMock.mock.calls.find(
      ([, opts]) => opts?.action === 'createSpace',
    );
    expect(createCall).toBeDefined();
    expect(createCall?.[0]).toMatchObject({
      message: 'Could not create the Mioframe space',
      code: 'mioframeSpacePick.createFailed',
    });
    expect(createCall?.[0].cause).toBe(rawInitError);
  });

  it('reports a DomainError preserving raw mount error as cause when create mounting fails', async () => {
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
    const rawMountError = new Error('raw filesystem detail');
    addDeviceDirectoryMock.mockRejectedValueOnce(rawMountError);
    const createFlow = useCreateMioframeSpace(ref(parentHandle));

    await expect(createFlow.createSpace('Work Notes')).resolves.toBe(false);
    expect(initializeRepositoryMock).not.toHaveBeenCalled();
    expect(disconnectDeviceFileMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe space',
    });
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({ feature: 'mioframeSpaceCreate', action: 'createSpace' });
    expect(reportedError).toMatchObject({
      message: 'Could not create the Mioframe space',
      code: 'mioframeSpacePick.createFailed',
    });
    expect(reportedError.cause).toBe(rawMountError);
  });

  it('returns false after reporting a DomainError with raw filesystem error as cause when availability inspection fails unexpectedly', async () => {
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
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({ feature: 'mioframeSpaceCreate', action: 'createSpace' });
    expect(reportedError).toMatchObject({
      message: 'Could not create the Mioframe space',
      code: 'mioframeSpacePick.createFailed',
    });
    expect(reportedError.cause).toMatchObject({ message: 'raw filesystem detail' });
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

  it('reports a DomainError preserving raw picker error as cause when open flow hits an unexpected picker failure', async () => {
    const rawPickerError = new Error('raw picker detail');
    showDirectoryPickerMock.mockRejectedValueOnce(rawPickerError);

    await useOpenMioframeSpace().openSpace();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not open the Mioframe space',
    });
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({ feature: 'mioframeSpaceOpen', action: 'openSpace' });
    expect(reportedError).toMatchObject({
      message: 'Could not open the Mioframe space',
      code: 'mioframeSpacePick.openFailed',
    });
    expect(reportedError.cause).toBe(rawPickerError);
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- Re-enable after DOM File System Access API test mocks. */
