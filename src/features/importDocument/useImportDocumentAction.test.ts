import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requestAccessMock,
  readJsonFileTextMock,
  importDocumentFromJsonTextMock,
  importDocumentFromJsonPathMock,
  addSnackbarMock,
  confirmMock,
  captureDiagnosticExceptionMock,
} = vi.hoisted(() => ({
  requestAccessMock: vi.fn(),
  readJsonFileTextMock: vi.fn(),
  importDocumentFromJsonTextMock: vi.fn(),
  importDocumentFromJsonPathMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  confirmMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
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

vi.mock('./useImportDocument', () => ({
  useImportDocument: () => ({
    readJsonFileText: readJsonFileTextMock,
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
  RepositoryImportErrorCode: {
    invalidJson: 'repositories.importInvalidJson',
    invalidDocumentFormat: 'repositories.importInvalidDocumentFormat',
    fileReadFailed: 'repositories.importFileReadFailed',
  },
  useMainServiceClient: () => ({
    repositories: {
      importDocumentFromJsonPath: importDocumentFromJsonPathMock,
      importDocumentFromJsonText: importDocumentFromJsonTextMock,
    },
  }),
}));

const validJsonText = JSON.stringify({ name: 'Doc', type: 'note', version: 1, body: {} });

describe('useImportDocumentAction', () => {
  beforeEach(() => {
    requestAccessMock.mockReset();
    readJsonFileTextMock.mockReset();
    importDocumentFromJsonTextMock.mockReset();
    importDocumentFromJsonPathMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
  });

  it('silently ignores file picker cancellation', async () => {
    readJsonFileTextMock.mockResolvedValue(undefined);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows a file open error and reports it to diagnostics', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
    readJsonFileTextMock.mockRejectedValue(
      new DomainError('Could not open the selected file', {
        cause: new Error('access denied'),
        code: ImportDocumentErrorCode.fileOpenFailed,
      }),
    );

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not open the selected file',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('shows a file read error and reports it to diagnostics', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
    readJsonFileTextMock.mockRejectedValue(
      new DomainError('Could not import the document', {
        cause: new Error('read failed'),
        code: ImportDocumentErrorCode.fileReadFailed,
      }),
    );

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not import the document',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
  });

  it('shows invalid JSON errors from service without reporting them', async () => {
    const { DomainError } = await import('@shared/lib/error');
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockRejectedValue(
      new DomainError('The selected file is not valid JSON', {
        cause: new Error('parse'),
        code: 'repositories.importInvalidJson',
      }),
    );

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'The selected file is not valid JSON',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows invalid document format errors from service without reporting them', async () => {
    const { DomainError } = await import('@shared/lib/error');
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockRejectedValue(
      new DomainError('The selected JSON file is not a Mioframe document', {
        cause: new Error('zod'),
        code: 'repositories.importInvalidDocumentFormat',
      }),
    );

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'The selected JSON file is not a Mioframe document',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows a success snackbar after a document is imported', async () => {
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockResolvedValue('document-id');

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBe('document-id');
    expect(importDocumentFromJsonTextMock).toHaveBeenCalledWith('/documents', validJsonText);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Document imported into this Mioframe folder',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports unexpected import failures and preserves raw error as cause', async () => {
    const error = new Error('unexpected failure at /private/path/notes.json');
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockRejectedValue(error);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not import the document',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    const { DomainError } = await import('@shared/lib/error');
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(error);
    expect(reportedError.message).not.toContain('/private/path');
  });

  it('passes original DomainError directly to diagnostics without wrapping', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
    const rawCause = new Error('failed to import /Users/alice/Documents/private.json');
    const error = new DomainError('Could not import the document', {
      cause: rawCause,
      code: ImportDocumentErrorCode.fileReadFailed,
    });
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockRejectedValue(error);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBe(error);
  });

  it('does not request permission and shows a safe message when user cancels the grant dialog', async () => {
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockRejectedValueOnce(
      createSerializedRecoveryError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    confirmMock.mockResolvedValue(false);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(requestAccessMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Grant write access to import documents into this remembered space.',
    });
    expect(importDocumentFromJsonTextMock).toHaveBeenCalledTimes(1);
  });

  it('shows denied write-access message when broker returns denied', async () => {
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockRejectedValueOnce(
      createSerializedRecoveryError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'denied' });

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Importing documents is not allowed in this remembered space because your browser denied write access.',
    });
    expect(importDocumentFromJsonTextMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows a safe message when browser prompting fails and does not retry', async () => {
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock.mockRejectedValueOnce(
      createSerializedRecoveryError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'error' });

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not request browser permission. Try again from this action.',
    });
    expect(importDocumentFromJsonTextMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports retry failure through import error path without reopening the file picker', async () => {
    const retryError = new Error('disk full');
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock
      .mockRejectedValueOnce(
        createSerializedRecoveryError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      )
      .mockRejectedValueOnce(retryError);
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'granted' });

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(importDocumentFromJsonTextMock).toHaveBeenCalledTimes(2);
    expect(readJsonFileTextMock).toHaveBeenCalledTimes(1);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not import the document',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    const { DomainError } = await import('@shared/lib/error');
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(retryError);
  });

  it('requests write access after a write-required import failure and retries the worker service command', async () => {
    readJsonFileTextMock.mockResolvedValue(validJsonText);
    importDocumentFromJsonTextMock
      .mockRejectedValueOnce(
        createSerializedRecoveryError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      )
      .mockResolvedValueOnce('document-id');
    confirmMock.mockResolvedValue(true);
    requestAccessMock.mockResolvedValue({ status: 'granted' });

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBe('document-id');
    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Grant write access',
      supportingText:
        'Mioframe remembers "Work", but your browser requires write access before importing a document into it.',
      confirmLabel: 'Grant access',
      cancelLabel: 'Not now',
    });
    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });
    expect(importDocumentFromJsonTextMock).toHaveBeenCalledTimes(2);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Document imported into this Mioframe folder',
    });
  });

  describe('importDocumentFromPath', () => {
    it('shows a confirmation dialog before calling the worker service command', async () => {
      confirmMock.mockResolvedValue(false);

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(
        importDocumentFromPath('/documents', '/folder/doc.json'),
      ).resolves.toBeUndefined();
      expect(confirmMock).toHaveBeenCalledWith({
        headline: 'Import document',
        supportingText: 'Import this JSON file as a new Mioframe document in the current folder?',
        confirmLabel: 'Import',
        cancelLabel: 'Cancel',
      });
      expect(importDocumentFromJsonPathMock).not.toHaveBeenCalled();
      expect(addSnackbarMock).not.toHaveBeenCalled();
    });

    it('calls the worker service command with target and source paths after confirmation', async () => {
      confirmMock.mockResolvedValue(true);
      importDocumentFromJsonPathMock.mockResolvedValue('new-id');

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(importDocumentFromPath('/documents', '/folder/doc.json')).resolves.toBe(
        'new-id',
      );
      expect(importDocumentFromJsonPathMock).toHaveBeenCalledWith('/documents', '/folder/doc.json');
      expect(addSnackbarMock).toHaveBeenCalledWith({
        text: 'Document imported into this Mioframe folder',
      });
      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });

    it('shows invalid JSON error from service without reporting it to diagnostics', async () => {
      const { DomainError } = await import('@shared/lib/error');
      confirmMock.mockResolvedValue(true);
      importDocumentFromJsonPathMock.mockRejectedValue(
        new DomainError('The selected file is not valid JSON', {
          cause: new Error('parse'),
          code: 'repositories.importInvalidJson',
        }),
      );

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(
        importDocumentFromPath('/documents', '/folder/doc.json'),
      ).resolves.toBeUndefined();
      expect(addSnackbarMock).toHaveBeenCalledWith({
        text: 'The selected file is not valid JSON',
      });
      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });

    it('shows invalid document format error from service without reporting it to diagnostics', async () => {
      const { DomainError } = await import('@shared/lib/error');
      confirmMock.mockResolvedValue(true);
      importDocumentFromJsonPathMock.mockRejectedValue(
        new DomainError('The selected JSON file is not a Mioframe document', {
          cause: new Error('zod'),
          code: 'repositories.importInvalidDocumentFormat',
        }),
      );

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(
        importDocumentFromPath('/documents', '/folder/doc.json'),
      ).resolves.toBeUndefined();
      expect(addSnackbarMock).toHaveBeenCalledWith({
        text: 'The selected JSON file is not a Mioframe document',
      });
      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });

    it('allows duplicate document names and creates the document without rejection', async () => {
      confirmMock.mockResolvedValue(true);
      importDocumentFromJsonPathMock.mockResolvedValue('dup-id');

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(
        importDocumentFromPath('/documents', '/folder/existing-name.json'),
      ).resolves.toBe('dup-id');
      expect(importDocumentFromJsonPathMock).toHaveBeenCalledTimes(1);
      expect(addSnackbarMock).toHaveBeenCalledWith({
        text: 'Document imported into this Mioframe folder',
      });
    });

    it('requests write access after write-required failure and retries the worker service command', async () => {
      confirmMock.mockResolvedValue(true);
      importDocumentFromJsonPathMock
        .mockRejectedValueOnce(
          createSerializedRecoveryError({
            mode: 'readwrite',
            spaceName: 'Work',
          }),
        )
        .mockResolvedValueOnce('retried-id');
      requestAccessMock.mockResolvedValue({ status: 'granted' });

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(importDocumentFromPath('/documents', '/folder/doc.json')).resolves.toBe(
        'retried-id',
      );
      expect(importDocumentFromJsonPathMock).toHaveBeenCalledTimes(2);
      expect(addSnackbarMock).toHaveBeenCalledWith({
        text: 'Document imported into this Mioframe folder',
      });
      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });
  });
});
