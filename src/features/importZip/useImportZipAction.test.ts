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
  RepositoryZipErrorCode: {
    importConflict: 'repositories.zipImportConflict',
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
  });

  it('silently ignores file picker cancellation', async () => {
    pickZipFileMock.mockResolvedValue(undefined);

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows a file open error and reports it to diagnostics', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportZipErrorCode } = await import('./importZipErrorCode');
    pickZipFileMock.mockRejectedValue(
      new DomainError('Could not open the selected file', {
        cause: new Error('access denied'),
        code: ImportZipErrorCode.fileOpenFailed,
      }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Could not open the selected file' });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('shows a conflict error from the service without reporting it to diagnostics', async () => {
    const { DomainError } = await import('@shared/lib/error');
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValue(
      new DomainError(
        'The selected directory already has files with the same names as the archive. Import was stopped before any changes were made.',
        { code: 'repositories.zipImportConflict' },
      ),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'The selected directory already has files with the same names as the archive. Import was stopped before any changes were made.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows a damaged archive error without reporting it to diagnostics', async () => {
    const { DomainError } = await import('@shared/lib/error');
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValue(
      new DomainError('The archive is damaged or not a supported ZIP file.', {
        code: 'zipArchive.archiveDamaged',
      }),
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports progress updates while the import is running', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockImplementation(
      (_path: string, _bytes: Uint8Array, onProgress: (p: unknown) => void) => {
        onProgress({ phase: 'validatingArchive' });
        onProgress({ phase: 'unpacking', current: 1, total: 2 });
        return Promise.resolve(undefined);
      },
    );

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip, progress, isRunning } = useImportZipAction();

    expect(isRunning.value).toBe(false);
    await importDirectoryZip('/repo');

    expect(progress.value).toEqual({ phase: 'unpacking', current: 1, total: 2 });
    expect(isRunning.value).toBe(false);
  });

  it('shows a success snackbar after import completes', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockResolvedValue(undefined);

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(true);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'ZIP archive imported into this folder.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports unexpected import failures and preserves raw error as cause', async () => {
    const error = new Error('unexpected failure');
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValue(error);

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Could not import the ZIP archive' });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    const { DomainError } = await import('@shared/lib/error');
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(error);
  });

  it('does not request permission and shows a safe message when user cancels the grant dialog', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
    );
    confirmMock.mockResolvedValue(false);

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(requestAccessMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Grant write access to import a ZIP archive into this remembered space.',
    });
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(1);
  });

  it('requests write access after a write-required failure and retries with the same bytes', async () => {
    const file = makeFile();
    pickZipFileMock.mockResolvedValue(file);
    importDirectoryZipMock
      .mockRejectedValueOnce(
        createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
      )
      .mockResolvedValueOnce(undefined);
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'granted' });

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(true);
    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      requestedMode: 'readwrite',
      spaceName: 'Work',
    });
    expect(importDirectoryZipMock).toHaveBeenCalledTimes(2);
    expect(pickZipFileMock).toHaveBeenCalledTimes(1);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'ZIP archive imported into this folder.',
    });
  });

  it('shows denied write-access message when broker returns denied', async () => {
    pickZipFileMock.mockResolvedValue(makeFile());
    importDirectoryZipMock.mockRejectedValueOnce(
      createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
    );
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'denied' });

    const { useImportZipAction } = await import('./useImportZipAction');
    const { importDirectoryZip } = useImportZipAction();

    await expect(importDirectoryZip('/repo')).resolves.toBe(false);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Importing a ZIP archive is not allowed in this remembered space because your browser denied write access.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });
});
