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

  it('preserves the original cause when fetching the document state fails', async () => {
    const cause = new Error('Could not load the document for export');
    fetchMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    const error = await saveJsonFile('/documents', documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export the document',
      cause,
    });
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

  it('does not treat non-AbortError save failures as user cancellation', async () => {
    const cause = new DOMException('Could not save the exported file', 'NotAllowedError');
    fileSaveMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    const error = await saveJsonFile('/documents', documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export the document',
      cause,
    });
  });

  it('preserves a safe cause message for reporting when export loading fails', async () => {
    const cause = new Error('Could not load the document for export');
    fetchMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    const error = await saveJsonFile('/documents', documentId).catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export the document',
      cause: expect.objectContaining({
        message: 'Could not load the document for export',
      }),
    });
  });

  it('preserves an existing DomainError when saving fails', async () => {
    const cause = new DomainError('Could not export the document');
    fileSaveMock.mockRejectedValueOnce(cause);

    const { saveJsonFile } = useExportDocument();

    await expect(saveJsonFile('/documents', documentId)).rejects.toBe(cause);
  });
});
