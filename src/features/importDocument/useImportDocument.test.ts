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

const validDocument = {
  body: {},
  name: 'Doc',
  type: 'note',
  version: 1,
} as const;

describe('useImportDocument', () => {
  beforeEach(() => {
    createDocumentMock.mockReset();
    fileOpenMock.mockReset();
    createDocumentMock.mockResolvedValue('document-id');
  });

  it('wraps invalid JSON with a user-facing DomainError', async () => {
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue('{'),
      name: 'Doc.json',
    });

    const { readImportDocumentDraft } = useImportDocument();

    const error = await readImportDocumentDraft().catch((caughtError: unknown) => caughtError);

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
      name: 'Doc.json',
    });

    const { readImportDocumentDraft } = useImportDocument();

    const error = await readImportDocumentDraft().catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'The selected JSON file is not a Mioframe document',
    });
    expect(error).toHaveProperty('cause');
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('reads a valid Mioframe JSON draft', async () => {
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue(JSON.stringify(validDocument)),
      name: 'Doc.json',
    });

    const { readImportDocumentDraft } = useImportDocument();

    await expect(readImportDocumentDraft()).resolves.toEqual({
      initialValue: validDocument,
    });
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('preserves raw repository failure as cause when document creation fails', async () => {
    const rawCause = new Error(
      'Failed to write /Device files/Private/Tax 2025/document.json for file-id gd-123',
    );
    createDocumentMock.mockRejectedValueOnce(rawCause);

    const { createImportedDocument } = useImportDocument();

    const error = await createImportedDocument('/documents', {
      initialValue: validDocument,
    }).catch((caughtError: unknown) => caughtError);

    expect(createDocumentMock).toHaveBeenCalledWith('/documents', validDocument);
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not import the document',
      code: 'importDocument.documentImportFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
    expect(error.message).not.toContain('gd-123');
  });

  it('creates a document from a validated draft and returns its id', async () => {
    const { createImportedDocument } = useImportDocument();

    await expect(
      createImportedDocument('/documents', {
        initialValue: validDocument,
      }),
    ).resolves.toBe('document-id');
    expect(createDocumentMock).toHaveBeenCalledWith('/documents', validDocument);
  });

  it('preserves an existing DomainError when document creation fails', async () => {
    const cause = new DomainError('The selected JSON file is not a Mioframe document');
    createDocumentMock.mockRejectedValueOnce(cause);

    const { createImportedDocument } = useImportDocument();

    await expect(
      createImportedDocument('/documents', {
        initialValue: validDocument,
      }),
    ).rejects.toBe(cause);
  });

  it('preserves raw file read error as cause when file reading fails', async () => {
    const rawCause = new Error('Could not read /Device files/Private/Tax 2025/document.json');
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockRejectedValue(rawCause),
      name: 'Doc.json',
    });

    const { readImportDocumentDraft } = useImportDocument();

    const error = await readImportDocumentDraft().catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not import the document',
      code: 'importDocument.fileReadFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('returns undefined when the user cancels file selection', async () => {
    fileOpenMock.mockRejectedValueOnce(new DOMException('User cancelled', 'AbortError'));

    const { readImportDocumentDraft } = useImportDocument();

    await expect(readImportDocumentDraft()).resolves.toBeUndefined();
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it('preserves raw picker error as cause when file open fails with a non-cancel error', async () => {
    const rawCause = new DOMException(
      'Could not access /Device files/Private/Tax 2025/document.json',
      'NotAllowedError',
    );
    fileOpenMock.mockRejectedValueOnce(rawCause);

    const { readImportDocumentDraft } = useImportDocument();

    const error = await readImportDocumentDraft().catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not open the selected file',
      code: 'importDocument.fileOpenFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
    expect(createDocumentMock).not.toHaveBeenCalled();
  });
});
