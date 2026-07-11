import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requestAccessMock,
  pickZipFileMock,
  importDirectoryZipMock,
  addSnackbarMock,
  confirmMock,
  captureDiagnosticExceptionMock,
  requestHomeDiagnosticsPromptAfterHandledErrorMock,
} = vi.hoisted(() => ({
  requestAccessMock: vi.fn(),
  pickZipFileMock: vi.fn(),
  importDirectoryZipMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  confirmMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
  requestHomeDiagnosticsPromptAfterHandledErrorMock: vi.fn(),
}));

const createSerializedRecoveryError = ({
  mode,
  spaceName,
}: {
  mode: 'read' | 'readwrite';
  spaceName: string;
}) =>
  Object.assign(new Error('Permission required to open this remembered local space'), {
    code: 'web-file-system-access-required',
    mode,
    name: 'WebFileSystemAccessRequiredError',
    spaceName,
  });

vi.mock('./useImportZip', () => ({
  useImportZip: () => ({
    pickZipFile: pickZipFileMock,
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
}));

vi.mock('@feature/diagnosticsErrorPrompt', () => ({
  useDiagnosticsErrorPromptTrigger: () => ({
    requestHomeDiagnosticsPromptAfterHandledError:
      requestHomeDiagnosticsPromptAfterHandledErrorMock,
  }),
}));

vi.mock('@shared/ui/Dialog', () => ({
  useDialog: () => ({
    confirm: confirmMock,
  }),
}));

vi.mock('@shared/serviceClient/fileSystem', () => ({
  useFileSystemAccessPermissionBroker: () => ({
    requestAccess: requestAccessMock,
  }),
}));

vi.mock('@shared/service', () => ({
  getZipImportPartialFailureDetails: (error: unknown) => {
    if (typeof error !== 'object' || error === null) return undefined;
    const importSummary = Reflect.get(error, 'importSummary');
    return importSummary ? { importSummary } : undefined;
  },
  RepositoryZipErrorCode: {
    importConflict: 'repositories.zipImportConflict',
    importResourceLimitExceeded: 'repositories.zipImportResourceLimitExceeded',
    documentStorageFilesNotFound: 'repositories.zipDocumentStorageFilesNotFound',
  },
  useMainServiceClient: () => ({
    repositories: {
      importDirectoryZip: importDirectoryZipMock,
    },
  }),
}));

const makeFile = () => new File(['zip-bytes'], 'archive.zip', { type: 'application/zip' });

describe('useImportZipAction', () => {
  beforeEach(() => {
    requestAccessMock.mockReset();
    pickZipFileMock.mockReset();
    importDirectoryZipMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    requestHomeDiagnosticsPromptAfterHandledErrorMock.mockReset();
    importDirectoryZipMock.mockResolvedValue({
      status: 'completed',
      summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
    });
  });

  it('silently ignores file picker cancellation and leaves the dialog idle', async () => {
    pickZipFileMock.mockResolvedValue(undefined);

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(state.value).toEqual({ status: 'idle' });
  });

  it('shows a file open error through the snackbar since no dialog is open yet', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportZipErrorCode } = await import('./importZipErrorCode');
    pickZipFileMock.mockRejectedValue(
      new DomainError('Could not open the selected file', {
        cause: new Error('access denied'),
        code: ImportZipErrorCode.fileOpenFailed,
      }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Could not open the selected file' });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    expect(state.value).toEqual({ status: 'idle' });
  });

  it('shows a conflict error from the service in the dialog without reporting it to diagnostics', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockResolvedValue({
      status: 'conflicts',
      report: { total: 1, paths: ['existing.txt'], truncated: false },
    });

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'conflicts',
      total: 1,
      paths: ['existing.txt'],
      truncated: false,
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows a damaged archive error in the dialog without reporting it to diagnostics', async () => {
    const { DomainError } = await import('@shared/lib/error');
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValue(
      new DomainError('The archive is damaged or not a supported ZIP file.', {
        code: 'zipArchive.archiveDamaged',
      }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message: 'The archive is damaged or not a supported ZIP file.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports progress updates while the import is running', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockImplementation(
      (_path: string, _bytes: Uint8Array, onProgress: (p: unknown) => void) => {
        onProgress({ phase: 'validatingArchive' });
        expect(state.value).toEqual({
          status: 'running',
          progress: { phase: 'validatingArchive' },
        });
        onProgress({ phase: 'unpacking', current: 1, total: 2 });
        expect(state.value).toEqual({
          status: 'running',
          progress: { phase: 'unpacking', current: 1, total: 2 },
        });
        return Promise.resolve({
          status: 'completed',
          summary: {
            importedFiles: 1,
            skippedFiles: 0,
            createdDirectories: 0,
            reusedDirectories: 0,
          },
        });
      },
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state, isRunning } = useImportZipAction();

    expect(isRunning.value).toBe(false);
    await importDirectoryZip('/repo');

    expect(state.value).toEqual({
      status: 'success',
      summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
    });
    expect(isRunning.value).toBe(false);
  });

  it('leaves the dialog state in success after import completes, without a duplicate snackbar', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockResolvedValue({
      status: 'completed',
      summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
    });

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(true);
    expect(state.value).toEqual({
      status: 'success',
      summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports unexpected import failures in the dialog and preserves raw error as cause', async () => {
    const error = new Error('unexpected failure');
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValue(error);

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({ status: 'error', message: 'Could not import the ZIP archive' });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    const { DomainError } = await import('@shared/lib/error');
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(error);
  });

  it('shows a safe error state and does not request permission when user cancels the grant dialog', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
    );
    confirmMock.mockResolvedValue(false);

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(requestAccessMock).not.toHaveBeenCalled();
    expect(state.value).toEqual({
      status: 'error',
      message: 'Grant write access to import a ZIP archive into this remembered space.',
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
  });

  it('requests write access after a write-required failure and retries with the same file', async () => {
    const file = makeFile();
    pickZipFileMock.mockResolvedValue(file);
    importDirectoryZipMock
      .mockRejectedValueOnce(
        createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
      )
      .mockResolvedValueOnce({
        status: 'completed',
        summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
      });
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'granted' });

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(true);
    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      requestedMode: 'readwrite',
      spaceName: 'Work',
    });
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(2);
    expect(pickZipFileMock).toHaveBeenCalledTimes(1);
    expect(state.value).toEqual({
      status: 'success',
      summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows a denied write-access error state when broker returns denied', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
    );
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'denied' });

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message:
        'Importing a ZIP archive is not allowed in this remembered space because your browser denied write access.',
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports a terminal partial state with no continuation action when a write fails after an earlier write succeeded', async () => {
    const { DomainError } = await import('@shared/lib/error');
    pickZipFileMock.mockResolvedValue(makeFile());
    const partialMessage =
      'The import stopped before completion. The target directory may contain a partial import.';
    importDirectoryZipMock.mockRejectedValueOnce(
      Object.assign(
        new DomainError(partialMessage, {
          code: 'repositories.zipImportWritePartiallyFailed',
          cause: new Error('storage failure'),
        }),
        {
          importSummary: {
            importedFiles: 1,
            skippedFiles: 0,
            createdDirectories: 0,
            reusedDirectories: 0,
          },
        },
      ),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const action = useImportZipAction();
    const { importDirectoryZip, state } = action;

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'partial',
      summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    // No continuation action is exposed for a partial import — it is a terminal result.
    expect(action).not.toHaveProperty('verifyAndContinueImport');
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
  });

  it('reports a terminal partial state when write access is lost after an earlier write succeeded, without retrying', async () => {
    const partialMessage =
      'The import stopped before completion. The target directory may contain a partial import.';
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      Object.assign(new Error(partialMessage), {
        code: 'repositories.zipImportWritePartiallyFailed',
        importSummary: {
          importedFiles: 1,
          skippedFiles: 0,
          createdDirectories: 0,
          reusedDirectories: 0,
        },
        cause: createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
      }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'partial',
      summary: { importedFiles: 1, skippedFiles: 0, createdDirectories: 0, reusedDirectories: 0 },
    });
    // A write-access failure after mutation began is a terminal partial result, not a
    // recoverable permission prompt — the grant-access flow must not be offered here.
    expect(confirmMock).not.toHaveBeenCalled();
    expect(requestAccessMock).not.toHaveBeenCalled();
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
  });

  it('closes the partial dialog back to idle, clearing feature state', async () => {
    const { DomainError } = await import('@shared/lib/error');
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      Object.assign(
        new DomainError('The import stopped before completion.', {
          code: 'repositories.zipImportWritePartiallyFailed',
          cause: new Error('storage failure'),
        }),
        {
          importSummary: {
            importedFiles: 1,
            skippedFiles: 0,
            createdDirectories: 0,
            reusedDirectories: 0,
          },
        },
      ),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state, closeImportZipDialog } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toMatchObject({ status: 'partial' });

    closeImportZipDialog();

    expect(state.value).toEqual({ status: 'idle' });
  });

  it('ignores a duplicate call while an import is already running', async () => {
    let resolveImport!: () => void;
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveImport = resolve;
        }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, isRunning } = useImportZipAction();

    const firstCall = importDirectoryZip('/repo');
    await Promise.resolve();
    await Promise.resolve();
    expect(isRunning.value).toBe(true);

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(pickZipFileMock).toHaveBeenCalledTimes(1);
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);

    resolveImport();
    await firstCall;
  });

  it('invalidates retained target state without cancelling an operation already in flight', async () => {
    let resolveImport!: (result: unknown) => void;
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        }),
    );
    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, invalidateImportZipContext, isRunning, state } =
      useImportZipAction();

    const running = importDirectoryZip('/old-target');
    await Promise.resolve();
    await Promise.resolve();
    invalidateImportZipContext();

    expect(state.value).toEqual({ status: 'idle' });
    expect(isRunning.value).toBe(true);
    await expect(importDirectoryZip('/new-target')).resolves.toBe(false);

    resolveImport({
      status: 'completed',
      summary: {
        importedFiles: 1,
        skippedFiles: 0,
        createdDirectories: 0,
        reusedDirectories: 0,
      },
    });
    await expect(running).resolves.toBe(false);
    expect(state.value).toEqual({ status: 'idle' });
    expect(isRunning.value).toBe(false);
  });

  it('does not close the dialog while running, but closes it after success or error', async () => {
    let resolveImport!: () => void;
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveImport = resolve;
        }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state, closeImportZipDialog } = useImportZipAction();

    const running = importDirectoryZip('/repo');
    await Promise.resolve();
    await Promise.resolve();

    closeImportZipDialog();
    expect(state.value).toEqual({ status: 'running' });

    resolveImport();
    await running;

    closeImportZipDialog();
    expect(state.value).toEqual({ status: 'idle' });
  });
});
