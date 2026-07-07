import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { zodDocumentId } from '@shared/lib/automerge';
import { useExportDocumentZip } from './useExportDocumentZip';

const { exportDocumentZipMock, saveStreamWithPickerMock } = vi.hoisted(() => ({
  exportDocumentZipMock: vi.fn(),
  saveStreamWithPickerMock: vi.fn(),
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
    saveStreamWithPicker: saveStreamWithPickerMock,
  };
});

type Producer = (write: (chunk: Uint8Array) => Promise<void>) => Promise<void>;

describe('useExportDocumentZip', () => {
  beforeEach(() => {
    exportDocumentZipMock.mockReset();
    saveStreamWithPickerMock.mockReset();
    exportDocumentZipMock.mockResolvedValue(undefined);
    saveStreamWithPickerMock.mockImplementation(async (produce: Producer) => {
      await produce(() => Promise.resolve());
      return true;
    });
  });

  it('suggests the document id as the filename', async () => {
    const { exportDocumentZip } = useExportDocumentZip();

    await exportDocumentZip('/documents', documentId);

    expect(saveStreamWithPickerMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        fileName: `${documentId}.zip`,
        extensions: ['.zip'],
        mimeTypes: ['application/zip'],
      }),
    );
    expect(exportDocumentZipMock).toHaveBeenCalledWith(
      '/documents',
      documentId,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('tracks isRunning for the duration of the export, ignoring duplicate starts', async () => {
    let resolveFirst!: () => void;
    saveStreamWithPickerMock.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveFirst = () => {
            resolve(true);
          };
        }),
    );

    const { exportDocumentZip, isRunning } = useExportDocumentZip();
    const firstCall = exportDocumentZip('/documents', documentId);

    expect(isRunning.value).toBe(true);

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);
    expect(saveStreamWithPickerMock).toHaveBeenCalledOnce();

    resolveFirst();
    await firstCall;

    expect(isRunning.value).toBe(false);
  });

  it('returns false when the user cancels the save dialog', async () => {
    saveStreamWithPickerMock.mockResolvedValueOnce(false);

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
