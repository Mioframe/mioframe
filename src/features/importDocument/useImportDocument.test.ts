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

    const { pickJsonFile } = useImportDocument();

    await expect(pickJsonFile()).resolves.toBeUndefined();
  });

  it('preserves raw picker error as cause when file open fails with a non-cancel error', async () => {
    const rawCause = new DOMException(
      'Could not access /Device files/Private/Tax 2025/document.json',
      'NotAllowedError',
    );
    fileOpenMock.mockRejectedValueOnce(rawCause);

    const { pickJsonFile } = useImportDocument();

    const error = await pickJsonFile().catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not open the selected file',
      code: 'importDocument.fileOpenFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
    expect(error.message).not.toContain('/Device files');
  });

  it('returns the selected File on successful selection without reading its text', async () => {
    const mockFile = new File(['{}'], 'Doc.json', { type: 'application/json' });
    const textSpy = vi.spyOn(mockFile, 'text');
    fileOpenMock.mockResolvedValue(mockFile);

    const { pickJsonFile } = useImportDocument();

    const result = await pickJsonFile();

    expect(result).toBe(mockFile);
    expect(textSpy).not.toHaveBeenCalled();
    expect(fileOpenMock).toHaveBeenCalledWith({
      description: 'JSON files',
      extensions: ['.json'],
      mimeTypes: ['application/json'],
    });
  });
});
