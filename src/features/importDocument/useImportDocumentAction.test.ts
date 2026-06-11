import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requestAccessMock,
  createImportedDocumentMock,
  readImportDocumentDraftMock,
  readImportDocumentDraftFromPathMock,
  addSnackbarMock,
  confirmMock,
  captureDiagnosticExceptionMock,
} = vi.hoisted(() => ({
  requestAccessMock: vi.fn(),
  createImportedDocumentMock: vi.fn(),
  readImportDocumentDraftMock: vi.fn(),
  readImportDocumentDraftFromPathMock: vi.fn(),
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
    createImportedDocument: createImportedDocumentMock,
    readImportDocumentDraft: readImportDocumentDraftMock,
    readImportDocumentDraftFromPath: readImportDocumentDraftFromPathMock,
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

describe('useImportDocumentAction', () => {
  beforeEach(() => {
    requestAccessMock.mockReset();
    createImportedDocumentMock.mockReset();
    readImportDocumentDraftMock.mockReset();
    readImportDocumentDraftFromPathMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
  });

  it('silently ignores file picker cancellation', async () => {
    readImportDocumentDraftMock.mockResolvedValue(undefined);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows invalid JSON errors without reporting them', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
    readImportDocumentDraftMock.mockRejectedValue(
      new DomainError('The selected file is not valid JSON', {
        cause: new Error('parse'),
        code: ImportDocumentErrorCode.invalidJson,
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

  it('shows a success snackbar after a document is imported', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockResolvedValue('document-id');

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBe('document-id');
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Document imported',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows invalid document format errors without reporting them', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
    readImportDocumentDraftMock.mockRejectedValue(
      new DomainError('The selected JSON file is not a Mioframe document', {
        cause: new Error('zod'),
        code: ImportDocumentErrorCode.invalidDocumentFormat,
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

  it('reports unexpected import failures and preserves raw error as cause', async () => {
    const error = new Error('unexpected failure at /private/path/notes.json');
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValue(error);

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
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValue(error);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not import the document',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBe(error);
  });

  it('does not request permission and shows a safe message when user cancels the grant dialog', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValueOnce(
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
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(1);
  });

  it('shows denied write-access message when broker returns denied', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValueOnce(
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
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('shows a safe message when browser prompting fails and does not retry', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValueOnce(
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
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports retry failure through import error path without reopening the file picker', async () => {
    const retryError = new Error('disk full');
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock
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
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(2);
    expect(readImportDocumentDraftMock).toHaveBeenCalledTimes(1);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not import the document',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    const { DomainError } = await import('@shared/lib/error');
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(retryError);
  });

  it('requests write access after a write-required import failure and retries the repository write', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock
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
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(2);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Document imported',
    });
  });

  describe('importDocumentFromPath', () => {
    it('shows a confirmation dialog before reading or creating', async () => {
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
      expect(readImportDocumentDraftFromPathMock).not.toHaveBeenCalled();
      expect(createImportedDocumentMock).not.toHaveBeenCalled();
      expect(addSnackbarMock).not.toHaveBeenCalled();
    });

    it('reads, validates, and creates a document after confirmation', async () => {
      confirmMock.mockResolvedValue(true);
      readImportDocumentDraftFromPathMock.mockResolvedValue({
        fileName: 'doc.json',
        initialValue: {},
      });
      createImportedDocumentMock.mockResolvedValue('new-id');

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(importDocumentFromPath('/documents', '/folder/doc.json')).resolves.toBe(
        'new-id',
      );
      expect(readImportDocumentDraftFromPathMock).toHaveBeenCalledWith('/folder/doc.json');
      expect(createImportedDocumentMock).toHaveBeenCalledWith('/documents', {
        fileName: 'doc.json',
        initialValue: {},
      });
      expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Document imported' });
      expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    });

    it('shows invalid JSON error without reporting it to diagnostics', async () => {
      const { DomainError } = await import('@shared/lib/error');
      const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
      confirmMock.mockResolvedValue(true);
      readImportDocumentDraftFromPathMock.mockRejectedValue(
        new DomainError('The selected file is not valid JSON', {
          cause: new Error('parse'),
          code: ImportDocumentErrorCode.invalidJson,
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
      expect(createImportedDocumentMock).not.toHaveBeenCalled();
    });

    it('shows invalid document format error without reporting it to diagnostics', async () => {
      const { DomainError } = await import('@shared/lib/error');
      const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
      confirmMock.mockResolvedValue(true);
      readImportDocumentDraftFromPathMock.mockRejectedValue(
        new DomainError('The selected JSON file is not a Mioframe document', {
          cause: new Error('zod'),
          code: ImportDocumentErrorCode.invalidDocumentFormat,
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
      expect(createImportedDocumentMock).not.toHaveBeenCalled();
    });

    it('allows duplicate document names and creates the document without rejection', async () => {
      confirmMock.mockResolvedValue(true);
      readImportDocumentDraftFromPathMock.mockResolvedValue({
        fileName: 'existing-name.json',
        initialValue: {},
      });
      createImportedDocumentMock.mockResolvedValue('dup-id');

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(
        importDocumentFromPath('/documents', '/folder/existing-name.json'),
      ).resolves.toBe('dup-id');
      expect(createImportedDocumentMock).toHaveBeenCalledTimes(1);
      expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Document imported' });
    });

    it('requests write access after a write-required failure and retries the repository write', async () => {
      confirmMock.mockResolvedValue(true);
      readImportDocumentDraftFromPathMock.mockResolvedValue({
        fileName: 'doc.json',
        initialValue: {},
      });
      createImportedDocumentMock
        .mockRejectedValueOnce(
          createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
        )
        .mockResolvedValueOnce('new-id');
      requestAccessMock.mockResolvedValue({ status: 'granted' });

      const { useImportDocumentAction } = await import('./useImportDocumentAction');
      const { importDocumentFromPath } = useImportDocumentAction();

      await expect(importDocumentFromPath('/documents', '/folder/doc.json')).resolves.toBe(
        'new-id',
      );
      expect(createImportedDocumentMock).toHaveBeenCalledTimes(2);
      expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Document imported' });
    });
  });
});
