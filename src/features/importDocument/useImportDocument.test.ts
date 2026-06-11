import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { useImportDocument } from './useImportDocument';

const { fileOpenMock } = vi.hoisted(() => ({
  fileOpenMock: vi.fn(),
}));

vi.mock('browser-fs-access', () => ({
  fileOpen: fileOpenMock,
}));

describe('useImportDocument', () => {
  beforeEach(() => {
    fileOpenMock.mockReset();
  });

  it('returns undefined when the user cancels file selection', async () => {
    fileOpenMock.mockRejectedValueOnce(new DOMException('User cancelled', 'AbortError'));

    const { readJsonFileText } = useImportDocument();

    await expect(readJsonFileText()).resolves.toBeUndefined();
  });

  it('preserves raw picker error as cause when file open fails with a non-cancel error', async () => {
    const rawCause = new DOMException(
      'Could not access /Device files/Private/Tax 2025/document.json',
      'NotAllowedError',
    );
    fileOpenMock.mockRejectedValueOnce(rawCause);

    const { readJsonFileText } = useImportDocument();

    const error = await readJsonFileText().catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not open the selected file',
      code: 'importDocument.fileOpenFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
  });

  it('preserves raw file read error as cause when file.text() fails', async () => {
    const rawCause = new Error('Could not read /Device files/Private/Tax 2025/document.json');
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockRejectedValue(rawCause),
      name: 'Doc.json',
    });

    const { readJsonFileText } = useImportDocument();

    const error = await readJsonFileText().catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not import the document',
      code: 'importDocument.fileReadFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
  });

  it('returns the raw file text on successful selection', async () => {
    const jsonText = JSON.stringify({ name: 'Doc', type: 'note', version: 1, body: {} });
    fileOpenMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue(jsonText),
      name: 'Doc.json',
    });

    const { readJsonFileText } = useImportDocument();

    await expect(readJsonFileText()).resolves.toBe(jsonText);
    expect(fileOpenMock).toHaveBeenCalledWith({
      description: 'JSON files',
      extensions: ['.json'],
      mimeTypes: ['application/json'],
    });
  });
});
