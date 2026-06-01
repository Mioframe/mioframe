import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const {
  createImportedDocumentMock,
  readImportDocumentDraftMock,
  addSnackbarMock,
  confirmMock,
  requestDeviceDirectoryAccessPermissionMock,
  reportHandledErrorMock,
} = vi.hoisted(() => ({
  createImportedDocumentMock: vi.fn(),
  readImportDocumentDraftMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  confirmMock: vi.fn(),
  requestDeviceDirectoryAccessPermissionMock: vi.fn(),
  reportHandledErrorMock: vi.fn(),
}));

vi.mock('./useImportDocument', () => ({
  useImportDocument: () => ({
    createImportedDocument: createImportedDocumentMock,
    readImportDocumentDraft: readImportDocumentDraftMock,
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

vi.mock('@shared/ui/Dialog', () => ({
  useDialog: () => ({
    confirm: confirmMock,
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      requestDeviceDirectoryAccessPermission: requestDeviceDirectoryAccessPermissionMock,
    },
  }),
}));

describe('useImportDocumentAction', () => {
  beforeEach(() => {
    createImportedDocumentMock.mockReset();
    readImportDocumentDraftMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    requestDeviceDirectoryAccessPermissionMock.mockReset();
    reportHandledErrorMock.mockReset();
  });

  it('silently ignores file picker cancellation', async () => {
    readImportDocumentDraftMock.mockResolvedValue(undefined);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
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
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
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
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('shows invalid document format errors without reporting them', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
    readImportDocumentDraftMock.mockRejectedValue(
      new DomainError('The selected JSON file is not a Beaver document', {
        cause: new Error('zod'),
        code: ImportDocumentErrorCode.invalidDocumentFormat,
      }),
    );

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'The selected JSON file is not a Beaver document',
    });
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('reports unexpected import failures with safe metadata', async () => {
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
    expect(reportHandledErrorMock).toHaveBeenCalledTimes(1);
    const [reportedError, metadata] = reportHandledErrorMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(Error);
    expect(reportedError).toMatchObject({
      message: 'Could not import the document',
      code: 'document-import-failed',
      cause: expect.objectContaining({
        message: 'Document JSON import failed',
      }),
    });
    expect(reportedError).not.toBe(error);
    expect(metadata).toEqual({
      feature: 'documentImport',
      action: 'importDocumentJson',
    });
  });

  it('does not report an inbound domain error with a private cause directly', async () => {
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
    expect(reportHandledErrorMock).toHaveBeenCalledTimes(1);

    const [reportedError, metadata] = reportHandledErrorMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(Error);
    expect(reportedError).toMatchObject({
      message: 'Could not import the document',
      code: ImportDocumentErrorCode.documentImportFailed,
      cause: expect.objectContaining({
        message: 'Document JSON import failed',
      }),
    });
    expect(reportedError).not.toBe(error);
    expect(reportedError?.cause).not.toBe(rawCause);
    expect(metadata).toEqual({
      feature: 'documentImport',
      action: 'importDocumentJson',
    });
  });

  it('does not request permission and shows recovery message when user cancels the grant dialog', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValueOnce(
      new WebFileSystemAccessRequiredError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    confirmMock.mockResolvedValue(false);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(requestDeviceDirectoryAccessPermissionMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Grant write access to edit this remembered space.',
    });
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(1);
  });

  it('shows denied write-access message when service returns denied', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValueOnce(
      new WebFileSystemAccessRequiredError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    confirmMock.mockResolvedValue(true);
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'denied' });

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(requestDeviceDirectoryAccessPermissionMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      spaceName: 'Work',
    });
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Editing is not allowed in this remembered space because your browser denied write access.',
    });
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(1);
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('shows recovery message when service returns a non-granted status', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock.mockRejectedValueOnce(
      new WebFileSystemAccessRequiredError({
        mode: 'readwrite',
        spaceName: 'Work',
      }),
    );
    confirmMock.mockResolvedValue(true);
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'cancelled' });

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Grant write access to edit this remembered space.',
    });
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(1);
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('reports retry failure through safe import error path without re-requesting the file', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock
      .mockRejectedValueOnce(
        new WebFileSystemAccessRequiredError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      )
      .mockRejectedValueOnce(new Error('disk full'));
    confirmMock.mockResolvedValue(true);
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'granted' });

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(2);
    expect(readImportDocumentDraftMock).toHaveBeenCalledTimes(1);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not import the document',
    });
    expect(reportHandledErrorMock).toHaveBeenCalledTimes(1);
    const [reportedError, metadata] = reportHandledErrorMock.mock.calls[0] ?? [];
    expect(reportedError).toMatchObject({
      message: 'Could not import the document',
      code: 'document-import-failed',
    });
    expect(metadata).toEqual({
      feature: 'documentImport',
      action: 'importDocumentJson',
    });
  });

  it('requests write access after a write-required import failure and retries the repository write', async () => {
    readImportDocumentDraftMock.mockResolvedValue({
      fileName: 'draft.json',
      initialValue: {},
    });
    createImportedDocumentMock
      .mockRejectedValueOnce(
        new WebFileSystemAccessRequiredError({
          mode: 'readwrite',
          spaceName: 'Work',
        }),
      )
      .mockResolvedValueOnce('document-id');
    confirmMock.mockResolvedValue(true);
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'granted' });

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
    expect(requestDeviceDirectoryAccessPermissionMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      spaceName: 'Work',
    });
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(2);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Document imported',
    });
  });
});
