import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const {
  createImportedDocumentMock,
  readImportDocumentDraftMock,
  addSnackbarMock,
  confirmMock,
  getDeviceDirectoryAccessRequestMock,
  reportHandledErrorMock,
  resolveDeviceDirectoryAccessRequestMock,
} = vi.hoisted(() => ({
  createImportedDocumentMock: vi.fn(),
  readImportDocumentDraftMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  confirmMock: vi.fn(),
  getDeviceDirectoryAccessRequestMock: vi.fn(),
  reportHandledErrorMock: vi.fn(),
  resolveDeviceDirectoryAccessRequestMock: vi.fn(),
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
      getDeviceDirectoryAccessRequest: getDeviceDirectoryAccessRequestMock,
      resolveDeviceDirectoryAccessRequest: resolveDeviceDirectoryAccessRequestMock,
    },
  }),
}));

describe('useImportDocumentAction', () => {
  beforeEach(() => {
    createImportedDocumentMock.mockReset();
    readImportDocumentDraftMock.mockReset();
    addSnackbarMock.mockReset();
    confirmMock.mockReset();
    getDeviceDirectoryAccessRequestMock.mockReset();
    reportHandledErrorMock.mockReset();
    resolveDeviceDirectoryAccessRequestMock.mockReset();
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

  it('requests write access after a write-required import failure and retries the repository write', async () => {
    const requestPermissionMock = vi.fn(() => Promise.resolve<'granted'>('granted'));
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
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      handle: {
        requestPermission: requestPermissionMock,
      },
      mode: 'readwrite',
      spaceName: 'Work',
    });
    confirmMock.mockResolvedValue(true);
    resolveDeviceDirectoryAccessRequestMock.mockResolvedValue({
      request: undefined,
      status: 'granted',
    });

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
    expect(requestPermissionMock).toHaveBeenCalledWith({
      mode: 'readwrite',
    });
    expect(resolveDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      permissionState: 'granted',
      spaceName: 'Work',
    });
    expect(createImportedDocumentMock).toHaveBeenCalledTimes(2);
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Document imported',
    });
  });
});
