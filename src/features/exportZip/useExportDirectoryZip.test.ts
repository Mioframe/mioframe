import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { useExportDirectoryZip } from './useExportDirectoryZip';

const { exportDirectoryZipMock, saveStreamWithPickerMock } = vi.hoisted(() => ({
  exportDirectoryZipMock: vi.fn(),
  saveStreamWithPickerMock: vi.fn(),
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
    saveStreamWithPicker: saveStreamWithPickerMock,
  };
});

type Producer = (write: (chunk: Uint8Array) => Promise<void>) => Promise<void>;

describe('useExportDirectoryZip', () => {
  beforeEach(() => {
    exportDirectoryZipMock.mockReset();
    saveStreamWithPickerMock.mockReset();
    exportDirectoryZipMock.mockResolvedValue(undefined);
    saveStreamWithPickerMock.mockImplementation(async (produce: Producer) => {
      await produce(() => Promise.resolve());
      return true;
    });
  });

  it('suggests a sanitized filename derived from the directory basename', async () => {
    const { exportDirectoryZip } = useExportDirectoryZip();

    await exportDirectoryZip('/My Repo:1');

    expect(saveStreamWithPickerMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        fileName: 'My Repo_1.zip',
        extensions: ['.zip'],
        mimeTypes: ['application/zip'],
      }),
    );
  });

  it('streams service-produced chunks straight to the picker write function', async () => {
    const written: Uint8Array[] = [];
    exportDirectoryZipMock.mockImplementation(
      async (
        _path: string,
        onChunk: (chunk: Uint8Array) => Promise<void>,
        onProgress: (p: unknown) => void,
      ) => {
        onProgress({ phase: 'preparing' });
        await onChunk(new Uint8Array([1, 2, 3]));
        onProgress({ phase: 'reading', current: 1 });
        await onChunk(new Uint8Array([4, 5, 6]));
      },
    );
    saveStreamWithPickerMock.mockImplementation(async (produce: Producer) => {
      await produce((chunk) => {
        written.push(chunk);
        return Promise.resolve();
      });
      return true;
    });

    const { exportDirectoryZip, progress } = useExportDirectoryZip();
    await exportDirectoryZip('/repo');

    expect(written).toEqual([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]);
    expect(progress.value).toEqual({ phase: 'saving' });
  });

  it('tracks isRunning for the duration of the export', async () => {
    const { exportDirectoryZip, isRunning } = useExportDirectoryZip();

    expect(isRunning.value).toBe(false);

    saveStreamWithPickerMock.mockImplementationOnce(async (produce: Producer) => {
      expect(isRunning.value).toBe(true);
      await produce(() => Promise.resolve());
      return true;
    });

    await exportDirectoryZip('/repo');

    expect(isRunning.value).toBe(false);
  });

  it('ignores a duplicate call while an export is already running', async () => {
    let resolveFirst!: () => void;
    saveStreamWithPickerMock.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveFirst = () => {
            resolve(true);
          };
        }),
    );

    const { exportDirectoryZip, isRunning } = useExportDirectoryZip();
    const firstCall = exportDirectoryZip('/repo');
    expect(isRunning.value).toBe(true);

    await expect(exportDirectoryZip('/repo')).resolves.toBe(false);
    expect(saveStreamWithPickerMock).toHaveBeenCalledOnce();

    resolveFirst();
    await expect(firstCall).resolves.toBe(true);
  });

  it('returns false when the user cancels the save dialog', async () => {
    saveStreamWithPickerMock.mockResolvedValueOnce(false);

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
