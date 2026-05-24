import { beforeEach, describe, expect, it, vi } from 'vitest';

const { importJsonFileMock, addSnackbarMock, reportHandledErrorMock } = vi.hoisted(() => ({
  importJsonFileMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  reportHandledErrorMock: vi.fn(),
}));

vi.mock('./useImportDocument', () => ({
  useImportDocument: () => ({
    importJsonFile: importJsonFileMock,
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

describe('useImportDocumentAction', () => {
  beforeEach(() => {
    importJsonFileMock.mockReset();
    addSnackbarMock.mockReset();
    reportHandledErrorMock.mockReset();
  });

  it('silently ignores file picker cancellation', async () => {
    importJsonFileMock.mockResolvedValue(undefined);

    const { useImportDocumentAction } = await import('./useImportDocumentAction');
    const { importDocument } = useImportDocumentAction();

    await expect(importDocument('/documents')).resolves.toBeUndefined();
    expect(addSnackbarMock).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).not.toHaveBeenCalled();
  });

  it('shows invalid JSON errors without reporting them', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('./importDocumentErrorCode');
    importJsonFileMock.mockRejectedValue(
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
    importJsonFileMock.mockResolvedValue('document-id');

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
    importJsonFileMock.mockRejectedValue(
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
    importJsonFileMock.mockRejectedValue(error);

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
});
