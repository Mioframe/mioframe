import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { zodDocumentId } from '@shared/lib/automerge';
import { useExportDocument } from './useExportDocument';

const { fetchMock, fileSaveMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  fileSaveMock: vi.fn(),
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

vi.mock('browser-fs-access', () => ({
  fileSave: fileSaveMock,
}));

describe('useExportDocument', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fileSaveMock.mockReset();
    fetchMock.mockResolvedValue({
      body: {},
      name: 'Doc',
      type: 'note',
      version: 1,
    });
    fileSaveMock.mockResolvedValue(undefined);
  });

  it('throws a user-facing DomainError when the document state is missing', async () => {
    fetchMock.mockResolvedValueOnce(undefined);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).rejects.toMatchObject({
      message: 'The document is not available for export',
    });
    expect(fetchMock).toHaveBeenCalledWith({
      path: '/documents',
      documentId,
    });
    expect(fileSaveMock).not.toHaveBeenCalled();
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
      message: 'Could not export the document',
      code: 'exportDocument.documentExportFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
    expect(error.message).not.toContain('gd-');
    expect(fileSaveMock).not.toHaveBeenCalled();
  });

  it('preserves an existing DomainError when fetching the document state fails', async () => {
    const cause = new DomainError('The document is not available for export');
    fetchMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).rejects.toBe(cause);
    expect(fileSaveMock).not.toHaveBeenCalled();
  });

  it('returns false when the user cancels the save dialog', async () => {
    fileSaveMock.mockRejectedValueOnce(new DOMException('User cancelled', 'AbortError'));

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).resolves.toBe(false);
    expect(fileSaveMock).toHaveBeenCalledOnce();
    expect(fileSaveMock.mock.calls[0]?.[1]).toEqual({
      fileName: `${documentId}.json`,
      extensions: ['.json'],
      mimeTypes: ['application/json'],
    });
  });

  it('returns true and saves the document JSON on success', async () => {
    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith({
      path: '/documents',
      documentId,
    });
    expect(fileSaveMock).toHaveBeenCalledOnce();

    const [blob, options] = fileSaveMock.mock.calls[0] ?? [];

    expect(options).toEqual({
      fileName: `${documentId}.json`,
      extensions: ['.json'],
      mimeTypes: ['application/json'],
    });
    await expect(blob.text()).resolves.toBe(
      JSON.stringify({
        body: {},
        name: 'Doc',
        type: 'note',
        version: 1,
      }),
    );
  });

  it('preserves raw save failure as cause when file save fails with a non-cancel error', async () => {
    const rawCause = new DOMException(
      'Could not save /Device files/Private/Tax 2025/4Z1fFANPScpDsLXmC1KsBCn4mWYu.json',
      'NotAllowedError',
    );
    fileSaveMock.mockRejectedValueOnce(rawCause);

    const { saveJsonFile } = useExportDocument();

    const error = await saveJsonFile('/documents', documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export the document',
      code: 'exportDocument.documentExportFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
  });

  it('preserves an existing DomainError when saving fails', async () => {
    const cause = new DomainError('Could not export the document');
    fileSaveMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).rejects.toBe(cause);
  });
});
