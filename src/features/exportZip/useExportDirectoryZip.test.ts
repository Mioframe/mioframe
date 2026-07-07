import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { useExportDirectoryZip } from './useExportDirectoryZip';

const { exportDirectoryZipMock, saveFileWithPickerMock } = vi.hoisted(() => ({
  exportDirectoryZipMock: vi.fn(),
  saveFileWithPickerMock: vi.fn(),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    repositories: {
      exportDirectoryZip: exportDirectoryZipMock,
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

describe('useExportDirectoryZip', () => {
  beforeEach(() => {
    exportDirectoryZipMock.mockReset();
    saveFileWithPickerMock.mockReset();
    exportDirectoryZipMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
    saveFileWithPickerMock.mockImplementation(async (createBlob: () => Promise<Blob>) => {
      await createBlob();
      return true;
    });
  });

  it('suggests a sanitized filename derived from the directory basename', async () => {
    const { exportDirectoryZip } = useExportDirectoryZip();

    await exportDirectoryZip('/My Repo:1');

    expect(saveFileWithPickerMock).toHaveBeenCalledWith(expect.any(Function), {
      fileName: 'My Repo_1.zip',
      extensions: ['.zip'],
      mimeTypes: ['application/zip'],
    });
  });

  it('reports service progress and a final saving phase, and tracks isRunning', async () => {
    const progressUpdates: unknown[] = [];
    exportDirectoryZipMock.mockImplementation((_path: string, onProgress: (p: unknown) => void) => {
      onProgress({ phase: 'preparing' });
      onProgress({ phase: 'reading', current: 1 });
      return Promise.resolve(new Uint8Array([1, 2, 3]));
    });

    const { exportDirectoryZip, progress, isRunning } = useExportDirectoryZip();

    expect(isRunning.value).toBe(false);

    saveFileWithPickerMock.mockImplementationOnce(async (createBlob: () => Promise<Blob>) => {
      expect(isRunning.value).toBe(true);
      await createBlob();
      progressUpdates.push(progress.value);
      return true;
    });

    await exportDirectoryZip('/repo');

    expect(progressUpdates).toEqual([{ phase: 'saving' }]);
    expect(isRunning.value).toBe(false);
  });

  it('returns false when the user cancels the save dialog', async () => {
    saveFileWithPickerMock.mockResolvedValueOnce(false);

    const { exportDirectoryZip } = useExportDirectoryZip();

    await expect(exportDirectoryZip('/repo')).resolves.toBe(false);
  });

  it('wraps an unexpected export failure as a DomainError', async () => {
    const rawCause = new Error('boom');
    exportDirectoryZipMock.mockRejectedValueOnce(rawCause);

    const { exportDirectoryZip } = useExportDirectoryZip();

    const error = await exportDirectoryZip('/repo').catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      message: 'Could not export the directory as a ZIP archive',
      code: 'exportZip.directoryExportFailed',
    });
    if (!(error instanceof DomainError)) throw new Error('expected DomainError');
    expect(error.cause).toBe(rawCause);
  });

  it('preserves an existing DomainError from the service', async () => {
    const cause = new DomainError('The document has no storage files to export.');
    exportDirectoryZipMock.mockRejectedValueOnce(cause);

    const { exportDirectoryZip } = useExportDirectoryZip();

    await expect(exportDirectoryZip('/repo')).rejects.toBe(cause);
  });
});
