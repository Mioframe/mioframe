/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- DOM File System Access API mocks need structural casting in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePickMioframeSpace } from './usePickMioframeSpace';

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

  it('create space mounts a suitable folder directly', async () => {
    const selectedHandle = createDirectoryHandle({ name: 'Project Space' });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(selectedHandle);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('create space does not hardcode or create a Mioframe subfolder', async () => {
    const selectedHandle = createDirectoryHandle({ name: 'My Named Space' });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(selectedHandle.getDirectoryHandleMock).not.toHaveBeenCalled();
  });

  it('create space guards against broad common folder names', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Choose a dedicated folder',
      supportingText:
        'This folder already contains other files. Create or select an empty folder for the new Mioframe space.',
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space guards against folders with many ordinary files', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: Array.from({ length: 12 }, (_, index) => [
        `notes-${index}.txt`,
        createFileHandle(`notes-${index}.txt`),
      ]),
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('open space opens the system directory picker directly', async () => {
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

  it('open space mounts a folder that appears to contain an existing Mioframe space', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Archive',
      entries: [['another-id.automerge', createFileHandle('another-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(existingSpaceHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('open space does not mount a folder that lacks Mioframe space signals', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'No Mioframe space found',
      supportingText:
        'This folder does not contain Mioframe service files. Select an existing Mioframe space folder.',
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('open space retries selection instead of offering create-here behavior', async () => {
    const invalidHandle = createDirectoryHandle({
      name: 'Regular Folder',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    const validHandle = createDirectoryHandle({
      name: 'Existing Space',
      entries: [['space-id.automerge', createFileHandle('space-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(invalidHandle).mockResolvedValueOnce(validHandle);
    confirmMock.mockResolvedValueOnce(true);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(confirmMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        confirmLabel: 'Create here',
      }),
    );
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(2);
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(validHandle);
  });

  it('reports a privacy-safe error when opening a selected folder fails', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Existing Space',
      entries: [['space-id.automerge', createFileHandle('space-id.automerge')]],
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
      }),
      {
        feature: 'mioframeSpacePick',
        action: 'openSpace',
      },
    );
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions, @typescript-eslint/require-await -- Re-enable after DOM File System Access API test mocks. */
