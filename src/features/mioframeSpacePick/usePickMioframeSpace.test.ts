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

  it('create space mounts an empty folder directly', async () => {
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

  it('create space asks for confirmation before using a broad common folder name', async () => {
    showDirectoryPickerMock.mockResolvedValueOnce(createDirectoryHandle({ name: 'Documents' }));
    confirmMock.mockResolvedValueOnce(false);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Create Mioframe space here?',
      supportingText:
        'This is a common system folder. Mioframe files will be stored directly in the selected folder.',
      confirmLabel: 'Create here',
      cancelLabel: 'Cancel',
    });
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space asks for confirmation before using a non-empty ordinary folder', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: Array.from({ length: 12 }, (_, index) => [
        `notes-${index}.txt`,
        createFileHandle(`notes-${index}.txt`),
      ]),
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);
    confirmMock.mockResolvedValueOnce(false);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Create Mioframe space here?',
      supportingText:
        'This folder already contains files. Mioframe files will be stored directly in the selected folder.',
      confirmLabel: 'Create here',
      cancelLabel: 'Cancel',
    });
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space mounts a non-empty ordinary folder after explicit confirmation', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);
    confirmMock.mockResolvedValueOnce(true);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(selectedHandle);
  });

  it('create space does not mount when the user cancels the confirmation', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);
    confirmMock.mockResolvedValueOnce(false);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space asks for confirmation before opening an existing Mioframe space', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Existing Space',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);
    confirmMock.mockResolvedValueOnce(false);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Open existing Mioframe space?',
      supportingText:
        'This folder already contains the current Mioframe space marker file. Open that space instead of creating a new one.',
      confirmLabel: 'Open space',
      cancelLabel: 'Cancel',
    });
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('create space opens an existing Mioframe space after confirmation', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Existing Space',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);
    confirmMock.mockResolvedValueOnce(true);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(selectedHandle);
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

  it('open space still detects the current marker file after many unrelated entries', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Deep Space',
      entries: [
        ...Array.from(
          { length: 40 },
          (_, index) =>
            [`notes-${index}.txt`, createFileHandle(`notes-${index}.txt`)] satisfies [
              string,
              FileSystemHandle,
            ],
        ),
        ['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')],
      ],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(existingSpaceHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('open space mounts a folder that contains the current marker file', async () => {
    const existingSpaceHandle = createDirectoryHandle({
      name: 'Archive',
      entries: [['storage-adapter-id.automerge', createFileHandle('storage-adapter-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(existingSpaceHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(addDeviceDirectoryMock).toHaveBeenCalledWith(existingSpaceHandle);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('open space does not treat legacy marker file names as a current Mioframe space', async () => {
    const selectedHandle = createDirectoryHandle({
      name: 'Archive',
      entries: [['another-id.automerge', createFileHandle('another-id.automerge')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith({
      headline: 'No Mioframe space found',
      supportingText:
        'The selected folder is not a Mioframe space because the current Mioframe space marker file was not found.',
      confirmLabel: 'OK',
    });
  });

  it('open space with an ordinary folder and no marker shows an explanation without retrying', async () => {
    const ordinaryHandle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(ordinaryHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(alertMock).toHaveBeenCalledWith({
      headline: 'No Mioframe space found',
      supportingText:
        'The selected folder is not a Mioframe space because the current Mioframe space marker file was not found.',
      confirmLabel: 'OK',
    });
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
  });

  it('open space with Documents and no marker shows an explanation without retrying', async () => {
    const documentsHandle = createDirectoryHandle({
      name: 'Documents',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    showDirectoryPickerMock.mockResolvedValueOnce(documentsHandle);

    const { openSpace } = usePickMioframeSpace();

    await openSpace();

    expect(alertMock).toHaveBeenCalledWith({
      headline: 'No Mioframe space found',
      supportingText:
        'The selected folder is not a Mioframe space because the current Mioframe space marker file was not found.',
      confirmLabel: 'OK',
    });
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);
    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
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
    const selectedHandle = createDirectoryHandle({ name: 'Project Space' });
    addDeviceDirectoryMock.mockRejectedValueOnce(new Error('raw filesystem detail'));
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

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
    expect(confirmMock).not.toHaveBeenCalled();
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
    const selectedHandle = createDirectoryHandle({
      name: 'Protected Space',
      entries: [['notes.txt', createFileHandle('notes.txt')]],
    });
    selectedHandle.getFileHandle = vi.fn(async () => {
      throw new DOMException('permission denied: Protected Space', 'SecurityError');
    });
    showDirectoryPickerMock.mockResolvedValueOnce(selectedHandle);

    const { createSpace } = usePickMioframeSpace();

    await createSpace();

    expect(addDeviceDirectoryMock).not.toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();
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
