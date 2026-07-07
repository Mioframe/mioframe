import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { zodDocumentId } from '@shared/lib/automerge';
import { useExportDocumentZip } from './useExportDocumentZip';

const { exportDocumentZipMock, saveFileWithPickerMock } = vi.hoisted(() => ({
  exportDocumentZipMock: vi.fn(),
  saveFileWithPickerMock: vi.fn(),
}));

const documentId = zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu');

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    repositories: {
      exportDocumentZip: exportDocumentZipMock,
    },
  }),
}));

vi.mock('@shared/lib/fileSystem', async () => {
  const actual =
    await vi.importActual<typeof import('@shared/lib/fileSystem')>('@shared/lib/fileSystem');

  return {
    ...actual,
    saveFileWithPicker: saveFileWithPickerMock,
  };
});

describe('useExportDocumentZip', () => {
  beforeEach(() => {
    exportDocumentZipMock.mockReset();
    saveFileWithPickerMock.mockReset();
    exportDocumentZipMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
    saveFileWithPickerMock.mockImplementation(async (createBlob: () => Promise<Blob>) => {
      await createBlob();
      return true;
    });
  });

  it('suggests the document id as the filename', async () => {
    const { exportDocumentZip } = useExportDocumentZip();

    await exportDocumentZip('/documents', documentId);

    expect(saveFileWithPickerMock).toHaveBeenCalledWith(expect.any(Function), {
      fileName: `${documentId}.zip`,
      extensions: ['.zip'],
      mimeTypes: ['application/zip'],
    });
    expect(exportDocumentZipMock).toHaveBeenCalledWith(
      '/documents',
      documentId,
      expect.any(Function),
    );
  });

  it('returns false when the user cancels the save dialog', async () => {
    saveFileWithPickerMock.mockResolvedValueOnce(false);

    const { exportDocumentZip } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);
  });

  it('preserves an existing DomainError from the service, e.g. no storage files', async () => {
    const cause = new DomainError('The document has no storage files to export.');
    exportDocumentZipMock.mockRejectedValueOnce(cause);

    const { exportDocumentZip } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).rejects.toBe(cause);
  });

  it('wraps an unexpected export failure as a DomainError', async () => {
    const rawCause = new Error('boom');
    exportDocumentZipMock.mockRejectedValueOnce(rawCause);

    const { exportDocumentZip } = useExportDocumentZip();

    const error = await exportDocumentZip('/documents', documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export the document as a ZIP archive',
      code: 'exportZip.documentExportFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
  });
});
