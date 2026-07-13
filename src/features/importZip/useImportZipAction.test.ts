import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import { RepositoryZipErrorCode } from '@shared/service';
import type { ZipImportSummary } from '@shared/service';

const {
  pickZipFileMock,
  importDirectoryZipMock,
  addSnackbarMock,
  captureDiagnosticExceptionMock,
  requestHomeDiagnosticsPromptAfterHandledErrorMock,
} = vi.hoisted(() => ({
  pickZipFileMock: vi.fn(),
  importDirectoryZipMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
  requestHomeDiagnosticsPromptAfterHandledErrorMock: vi.fn(),
}));

// Builds a real `WebFileSystemAccessRequiredError` instance, matching what the client actually
// receives after such an error is deserialized back across the real worker/proxy boundary (see
// `repositoryZipImportWorkerBoundary.integration.test.ts` for the transport itself).
const createSerializedRecoveryError = ({
  mode,
  spaceName,
}: {
  mode: 'read' | 'readwrite';
  spaceName: string;
}) => new WebFileSystemAccessRequiredError({ mode, spaceName });

// Mirrors the shape of the private `ZipImportPartialFailureError` constructed in
// `repositoryZipImport.ts`: a `DomainError` carrying `importWritePartiallyFailed` and an
// `importSummary` set at construction time, without post-construction mutation.
class PartialImportFailureFixture extends DomainError {
  readonly importSummary: ZipImportSummary;

  constructor(importSummary: ZipImportSummary, cause: unknown = new Error('storage failure')) {
    super(
      'The import stopped before completion. The target directory may contain a partial import.',
      {
        cause,
        code: RepositoryZipErrorCode.importWritePartiallyFailed,
      },
    );
    this.importSummary = importSummary;
  }
}

const createPartialImportFailure = (importSummary: ZipImportSummary, cause?: unknown) =>
  new PartialImportFailureFixture(importSummary, cause);

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
    importWritePartiallyFailed: 'repositories.zipImportWritePartiallyFailed',
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
    pickZipFileMock.mockReset();
    importDirectoryZipMock.mockReset();
    addSnackbarMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    requestHomeDiagnosticsPromptAfterHandledErrorMock.mockReset();
    importDirectoryZipMock.mockResolvedValue({
      status: 'completed',
      summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
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
          summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
        });
      },
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state, isRunning } = useImportZipAction();

    expect(isRunning.value).toBe(false);
    await importDirectoryZip('/repo');

    expect(state.value).toEqual({
      status: 'success',
      summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
    });
    expect(isRunning.value).toBe(false);
  });

  it('leaves the dialog state in success after import completes, without a duplicate snackbar', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockResolvedValue({
      status: 'completed',
      summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
    });

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(true);
    expect(state.value).toEqual({
      status: 'success',
      summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
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
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(error);
  });

  it('propagates a write-access-recovery error as a plain terminal error before mutation starts, with no automatic retry and no diagnostics report', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message:
        'Write access is required. Open "Save failed", choose "Grant write access", then start the import again.',
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    // An expected recoverable access error is not a diagnostic exception.
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(requestHomeDiagnosticsPromptAfterHandledErrorMock).not.toHaveBeenCalled();
    // No permission grant/retry flow is offered — the user grants access through the general
    // application recovery mechanism and starts a new import manually.
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
    expect(pickZipFileMock).toHaveBeenCalledTimes(1);
  });

  it('propagates a read-access-recovery error as a plain terminal error with no diagnostics report', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message:
        'Folder access is required. Restore access to this remembered local space, then start the import again.',
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(requestHomeDiagnosticsPromptAfterHandledErrorMock).not.toHaveBeenCalled();
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
  });

  it('reports a terminal partial state with no continuation action when a write fails after an earlier write succeeded', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createPartialImportFailure({ importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const action = useImportZipAction();
    const { importDirectoryZip, state } = action;

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'partial',
      summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
    });
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    // No continuation action is exposed for a partial import — it is a terminal result.
    expect(action).not.toHaveProperty('verifyAndContinueImport');
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
  });

  it('reports a terminal partial state when write access is lost after an earlier write succeeded, without retrying', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createPartialImportFailure(
        { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
        createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
      ),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, state } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'partial',
      summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
    });
    // A write-access failure after mutation began is a terminal partial result, not a
    // recoverable permission prompt — no retry is attempted.
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
  });

  it('closes the partial dialog back to idle, clearing feature state', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createPartialImportFailure({ importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 }),
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
      summary: { importedFiles: 1, createdDirectories: 0, reusedDirectories: 0 },
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
