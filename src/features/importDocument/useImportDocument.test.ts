import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { useImportDocument } from './useImportDocument';

const { createDocumentMock, fileOpenMock } = vi.hoisted(() => ({
  createDocumentMock: vi.fn(),
  fileOpenMock: vi.fn(),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    repositories: {
      createDocument: createDocumentMock,
    },
  }),
}));

vi.mock('browser-fs-access', () => ({
  fileOpen: fileOpenMock,
}));

describe('useImportDocument', () => {
  beforeEach(() => {
    createDocumentMock.mockReset();
    fileOpenMock.mockReset();
    createDocumentMock.mockResolvedValue('document-id');
  });

  it('wraps invalid JSON with a user-facing DomainError', async () => {
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue('{'),
    });

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'The selected file is not valid JSON',
    });
    expect(error).toHaveProperty('cause');
    expect(fileOpenMock).toHaveBeenCalledWith({
      description: 'JSON files',
      extensions: ['.json'],
      mimeTypes: ['application/json'],
    });
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('wraps non-Beaver JSON with a user-facing DomainError', async () => {
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue(JSON.stringify({ name: 'Doc' })),
    });

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'The selected JSON file is not a Beaver document',
    });
    expect(error).toHaveProperty('cause');
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('preserves the original cause when document creation fails', async () => {
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          body: {},
          name: 'Doc',
          type: 'note',
          version: 1,
        }),
      ),
    });

    const cause = new Error('Create failed');
    createDocumentMock.mockRejectedValueOnce(cause);

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(createDocumentMock).toHaveBeenCalledWith('/documents', {
      body: {},
      name: 'Doc',
      type: 'note',
      version: 1,
    });
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not import the document',
      cause,
    });
  });

  it('preserves an existing DomainError when document creation fails', async () => {
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          body: {},
          name: 'Doc',
          type: 'note',
          version: 1,
        }),
      ),
    });

    const cause = new DomainError('The selected JSON file is not a Beaver document');
    createDocumentMock.mockRejectedValueOnce(cause);

    const { importJsonFile } = useImportDocument();

    await expect(importJsonFile('/documents')).rejects.toBe(cause);
  });

  it('wraps file read errors with a user-facing DomainError', async () => {
    const cause = new Error('Read failed');
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockRejectedValue(cause),
    });

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not import the document',
      cause,
    });
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('returns undefined when the user cancels file selection', async () => {
    fileOpenMock.mockRejectedValueOnce(new DOMException('User cancelled', 'AbortError'));

    const { importJsonFile } = useImportDocument();

    await expect(importJsonFile('/documents')).resolves.toBeUndefined();
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('does not treat non-AbortError picker failures as user cancellation', async () => {
    const cause = new DOMException('Permission denied', 'NotAllowedError');
    fileOpenMock.mockRejectedValueOnce(cause);

    const { importJsonFile } = useImportDocument();

    await expect(importJsonFile('/documents')).rejects.toBe(cause);
  });
});
