import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { zodDocumentId } from '@shared/lib/automerge';
import { useExportDocument } from './useExportDocument';

const { fetchMock, saveFileWithPickerMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  saveFileWithPickerMock: vi.fn(),
}));

const documentId = zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu');

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    documents: {
      cfrDocumentState: {
        fetch: fetchMock,
      },
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

describe('useExportDocument', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    saveFileWithPickerMock.mockReset();
    fetchMock.mockResolvedValue({
      body: {},
      name: 'Doc',
      type: 'note',
      version: 1,
    });
    saveFileWithPickerMock.mockImplementation(async (createBlob) => {
      await createBlob();
      return true;
    });
  });

  it('starts save target acquisition before fetching document state', async () => {
    const callOrder: string[] = [];
    fetchMock.mockImplementation(() => {
      callOrder.push('fetch');
      return Promise.resolve({
        body: {},
        name: 'Doc',
        type: 'note',
        version: 1,
      });
    });
    saveFileWithPickerMock.mockImplementation(async (createBlob) => {
      callOrder.push('save-target');
      const blob = await createBlob();
      callOrder.push(`blob:${await blob.text()}`);
      return true;
    });

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).resolves.toBe(true);

    expect(callOrder).toEqual([
      'save-target',
      'fetch',
      'blob:{"body":{},"name":"Doc","type":"note","version":1}',
    ]);
  });

  it('throws a user-facing DomainError when the document state is missing', async () => {
    fetchMock.mockResolvedValueOnce(undefined);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).rejects.toMatchObject({
      message: 'The document is not available for export',
      code: 'exportDocument.documentExportUnavailable',
    });
    expect(fetchMock).toHaveBeenCalledWith({
      path: '/documents',
      documentId,
    });
  });

  it('preserves raw document load failure as cause when fetch fails', async () => {
    const rawCause = new Error(
      'Could not load /Device files/Private/Tax 2025/document.json for document-id 4Z1fFANPScpDsLXmC1KsBCn4mWYu',
    );
    fetchMock.mockRejectedValueOnce(rawCause);

    const { saveJsonFile } = useExportDocument();

    const error = await saveJsonFile('/documents', documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export JSON',
      code: 'exportDocument.documentExportFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
    expect(error.message).not.toContain('gd-');
  });

  it('preserves an existing DomainError when fetching the document state fails', async () => {
    const cause = new DomainError('The document is not available for export');
    fetchMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).rejects.toBe(cause);
  });

  it('returns false when the user cancels the save dialog', async () => {
    saveFileWithPickerMock.mockResolvedValueOnce(false);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).resolves.toBe(false);
    expect(saveFileWithPickerMock).toHaveBeenCalledOnce();
  });

  it('returns true and saves the document JSON on success', async () => {
    let savedBlobText = '';
    saveFileWithPickerMock.mockImplementationOnce(async (createBlob, options) => {
      const blob = await createBlob();
      savedBlobText = await blob.text();
      expect(options).toEqual({
        fileName: `${documentId}.json`,
        extensions: ['.json'],
        mimeTypes: ['application/json'],
      });
      return true;
    });

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith({
      path: '/documents',
      documentId,
    });
    expect(savedBlobText).toBe(
      JSON.stringify({
        body: {},
        name: 'Doc',
        type: 'note',
        version: 1,
      }),
    );
  });

  it('preserves raw save failure as cause when save target writing fails', async () => {
    const rawCause = new DOMException(
      'Could not save /Device files/Private/Tax 2025/4Z1fFANPScpDsLXmC1KsBCn4mWYu.json',
      'NotAllowedError',
    );
    saveFileWithPickerMock.mockRejectedValueOnce(rawCause);

    const { saveJsonFile } = useExportDocument();

    const error = await saveJsonFile('/documents', documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export JSON',
      code: 'exportDocument.documentExportFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
  });

  it('preserves an existing DomainError when saving fails', async () => {
    const cause = new DomainError('Could not export JSON');
    saveFileWithPickerMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).rejects.toBe(cause);
  });
});
