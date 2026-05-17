/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- DOM File System Access API mocks need structural casting in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePickMioframeSpace } from './usePickMioframeSpace';
import { MIOFRAME_SPACE_FOLDER_NAME } from './mioframeSpacePick.helpers';

const { addDeviceDirectoryMock, addSnackbarMock, reportHandledErrorMock, showDirectoryPickerMock } =
  vi.hoisted(() => ({
    addDeviceDirectoryMock: vi.fn(),
    addSnackbarMock: vi.fn(),
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
        for (const [, handle] of entries) {
          yield handle as FileSystemDirectoryHandle | FileSystemFileHandle;
        }
      })()) as FileSystemDirectoryHandle['values'],
    getDirectoryHandle: getDirectoryHandleMock,
    getDirectoryHandleMock,
    getFileHandle: vi.fn(),
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
    reportHandledErrorMock.mockReset();
    showDirectoryPickerMock.mockReset();
    addDeviceDirectoryMock.mockResolvedValue(undefined);
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('shows a useful message when folder picking is unsupported', () => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: undefined,
    });

    const { openMioframeSpaceDialog, dialogState } = usePickMioframeSpace();

    openMioframeSpaceDialog();

    expect(dialogState.value).toBeUndefined();
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

    const { openMioframeSpaceDialog } = usePickMioframeSpace();

    openMioframeSpaceDialog();

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

    const { createNewSpace } = usePickMioframeSpace();

    await createNewSpace();

    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('keeps a create dialog open when subfolder creation is cancelled', async () => {
    const parentHandle = createDirectoryHandle({
      name: 'My Drive',
      subdirectoryFactory: () => {
        throw new DOMException('Cancelled', 'AbortError');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);

    const { createNewSpace, dialogState } = usePickMioframeSpace();

    await createNewSpace();

    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(dialogState.value).toBeUndefined();
  });

  it('does not open multiple pickers while loading', async () => {
    let resolvePicker: ((handle: FileSystemDirectoryHandle) => void) | undefined;
    showDirectoryPickerMock.mockImplementationOnce(
      () =>
        new Promise<FileSystemDirectoryHandle>((resolve) => {
          resolvePicker = resolve;
        }),
    );

    const { createNewSpace } = usePickMioframeSpace();
    const firstPromise = createNewSpace();
    const secondPromise = createNewSpace();

    resolvePicker?.(createDirectoryHandle({ name: 'Parent' }));
    await Promise.all([firstPromise, secondPromise]);

    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
  });

  it('creates a dedicated Mioframe subfolder for a new space when possible', async () => {
    const mioframeHandle = createDirectoryHandle({ name: MIOFRAME_SPACE_FOLDER_NAME });
    const parentHandle = createDirectoryHandle({
      name: 'My Drive',
      subdirectoryFactory: () => mioframeHandle,
    });
    showDirectoryPickerMock.mockResolvedValueOnce(parentHandle);

    const { createNewSpace } = usePickMioframeSpace();

    await createNewSpace();

    expect(parentHandle.getDirectoryHandleMock).toHaveBeenCalledWith(MIOFRAME_SPACE_FOLDER_NAME, {
      create: true,
    });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(mioframeHandle);
  });

  it('opens the create dialog from the entry dialog', () => {
    const { openCreateDialog, dialogState } = usePickMioframeSpace();

    openCreateDialog();

    expect(dialogState.value).toEqual({ kind: 'create' });
  });

  it('selecting a risky folder name triggers a warning', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const { openExistingSpace, dialogState } = usePickMioframeSpace();

    await openExistingSpace();

    expect(dialogState.value).toMatchObject({
      kind: 'warning',
      headline: 'Use the whole Documents folder?',
    });
  });

  it('choosing another location with an empty non-risky folder asks for confirmation before using it', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Project Space' }));

    const { chooseAnotherLocation, dialogState } = usePickMioframeSpace();

    await chooseAnotherLocation();

    expect(dialogState.value).toEqual({
      kind: 'confirmUseFolder',
      handle: expect.objectContaining({ name: 'Project Space' }),
      headline: 'Use this folder as a Mioframe space?',
      supportingText:
        'This folder is empty. Mioframe will store documents and service files inside it.',
      confirmLabel: 'Use this folder',
    });
  });

  it('uses the non-empty confirmation copy for a regular folder that does not look like an existing space', async () => {
    const regularHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(regularHandle);

    const { openExistingSpace, dialogState } = usePickMioframeSpace();

    await openExistingSpace();

    expect(dialogState.value).toMatchObject({
      kind: 'confirmUseFolder',
      supportingText:
        'This folder does not look like an existing Mioframe space. Mioframe will store documents and service files inside it.',
    });
  });

  it('choosing Use this folder from the warning still adds the selected folder', async () => {
    const riskyHandle = createDirectoryHandle({ name: 'Downloads' });
    showDirectoryPickerMock.mockResolvedValueOnce(riskyHandle);

    const { openExistingSpace, useSelectedFolder } = usePickMioframeSpace();

    await openExistingSpace();
    await useSelectedFolder();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(riskyHandle);
  });

  it('uses the selected folder from a confirmation dialog', async () => {
    const regularHandle = createDirectoryHandle({ name: 'Project Space' });
    showDirectoryPickerMock.mockResolvedValueOnce(regularHandle);

    const { chooseAnotherLocation, useSelectedFolder } = usePickMioframeSpace();

    await chooseAnotherLocation();
    await useSelectedFolder();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(regularHandle);
  });

  it('choosing Create Mioframe subfolder from the warning adds the subfolder instead', async () => {
    const mioframeHandle = createDirectoryHandle({ name: MIOFRAME_SPACE_FOLDER_NAME });
    const riskyHandle = createDirectoryHandle({
      name: 'My Drive',
      subdirectoryFactory: () => mioframeHandle,
    });
    showDirectoryPickerMock.mockResolvedValueOnce(riskyHandle);

    const { openExistingSpace, createSubfolderFromSelectedFolder } = usePickMioframeSpace();

    await openExistingSpace();
    await createSubfolderFromSelectedFolder();

    expect(riskyHandle.getDirectoryHandleMock).toHaveBeenCalledWith(MIOFRAME_SPACE_FOLDER_NAME, {
      create: true,
    });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(mioframeHandle);
  });

  it('shows a clear fallback when creating a Mioframe subfolder fails', async () => {
    const riskyHandle = createDirectoryHandle({
      name: 'My Drive',
      subdirectoryFactory: () => {
        throw new DOMException('Denied', 'NotAllowedError');
      },
    });
    showDirectoryPickerMock.mockResolvedValueOnce(riskyHandle);

    const { openExistingSpace, createSubfolderFromSelectedFolder, dialogState } =
      usePickMioframeSpace();

    await openExistingSpace();
    await createSubfolderFromSelectedFolder();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not create the Mioframe folder. Choose or create a dedicated folder manually.',
    });
    expect(dialogState.value).toEqual({ kind: 'create' });
  });

  it('ignores create-subfolder requests when the current dialog is not a warning', async () => {
    const regularHandle = createDirectoryHandle({ name: 'Project Space' });
    showDirectoryPickerMock.mockResolvedValueOnce(regularHandle);

    const { chooseAnotherLocation, createSubfolderFromSelectedFolder } = usePickMioframeSpace();

    await chooseAnotherLocation();
    await createSubfolderFromSelectedFolder();

    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('opens an existing Mioframe space without an unnecessary warning', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Mioframe',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(existingSpaceHandle);

    const { openExistingSpace, dialogState } = usePickMioframeSpace();

    await openExistingSpace();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
    expect(dialogState.value).toBeUndefined();
  });

  it('reports a privacy-safe error when using the selected folder fails', async () => {
    const riskyHandle = createDirectoryHandle({ name: 'Downloads' });
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    showDirectoryPickerMock.mockResolvedValueOnce(riskyHandle);

    const { openExistingSpace, useSelectedFolder } = usePickMioframeSpace();

    await openExistingSpace();
    await useSelectedFolder();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not open the Mioframe space',
    });
    expect(reportHandledErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Could not open the Mioframe space',
      }),
      {
        feature: 'mioframeSpacePick',
        action: 'useSelectedFolder',
      },
    );
  });

  it('does not close the dialog while a picker operation is still loading', async () => {
    let resolvePicker: ((handle: FileSystemDirectoryHandle) => void) | undefined;
    showDirectoryPickerMock.mockImplementationOnce(
      () =>
        new Promise<FileSystemDirectoryHandle>((resolve) => {
          resolvePicker = resolve;
        }),
    );

    const { openCreateDialog, createNewSpace, closeDialog, dialogState } = usePickMioframeSpace();

    openCreateDialog();
    const pendingCreate = createNewSpace();
    closeDialog();

    expect(dialogState.value).toEqual({ kind: 'create' });

    resolvePicker?.(createDirectoryHandle({ name: 'Parent' }));
    await pendingCreate;
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- Re-enable after DOM File System Access API test mocks. */
