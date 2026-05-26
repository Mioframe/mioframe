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

  it('wraps non-Mioframe JSON with a user-facing DomainError', async () => {
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue(JSON.stringify({ name: 'Doc' })),
    });

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'The selected JSON file is not a Mioframe document',
    });
    expect(error).toHaveProperty('cause');
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('replaces raw repository failure details with a safe cause when document creation fails', async () => {
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

    const rawCause = new Error(
      'Failed to write /Device files/Private/Tax 2025/document.json for file-id gd-123',
    );
    createDocumentMock.mockRejectedValueOnce(rawCause);

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
      code: 'document-import-failed',
      cause: expect.objectContaining({
        message: 'Document repository write operation failed',
      }),
    });
    expect(error).not.toHaveProperty('cause.message', rawCause.message);
  });

  it('creates a document from valid Mioframe JSON and returns its id', async () => {
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

    const { importJsonFile } = useImportDocument();

    await expect(importJsonFile('/documents')).resolves.toBe('document-id');
    expect(createDocumentMock).toHaveBeenCalledWith('/documents', {
      body: {},
      name: 'Doc',
      type: 'note',
      version: 1,
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

    const cause = new DomainError('The selected JSON file is not a Mioframe document');
    createDocumentMock.mockRejectedValueOnce(cause);

    const { importJsonFile } = useImportDocument();

    await expect(importJsonFile('/documents')).rejects.toBe(cause);
  });

  it('wraps file read errors with a privacy-safe technical cause', async () => {
    const rawCause = new Error('Could not read /Device files/Private/Tax 2025/document.json');
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockRejectedValue(rawCause),
    });

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not import the document',
      code: 'file-read-failed',
      cause: expect.objectContaining({
        message: 'Selected file read failed',
      }),
    });
    expect(error).not.toHaveProperty('cause.message', rawCause.message);
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('returns undefined when the user cancels file selection', async () => {
    fileOpenMock.mockRejectedValueOnce(new DOMException('User cancelled', 'AbortError'));

    const { importJsonFile } = useImportDocument();

    await expect(importJsonFile('/documents')).resolves.toBeUndefined();
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('does not treat non-AbortError picker failures as user cancellation', async () => {
    const rawCause = new DOMException(
      'Could not access /Device files/Private/Tax 2025/document.json',
      'NotAllowedError',
    );
    fileOpenMock.mockRejectedValueOnce(rawCause);

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not open the selected file',
      code: 'file-open-failed',
      cause: expect.objectContaining({
        message: 'Selected file open operation failed',
      }),
    });
    expect(error).not.toHaveProperty('cause.message', rawCause.message);
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('preserves a safe cause message for reporting when document creation fails', async () => {
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

    const cause = new Error('Could not write the imported document');
    createDocumentMock.mockRejectedValueOnce(cause);

    const { importJsonFile } = useImportDocument();

    const error = await importJsonFile('/documents').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not import the document',
      cause: expect.objectContaining({
        message: 'Document repository write operation failed',
      }),
    });
  });
});
