import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { FileSystemDomainErrorCode } from '@shared/lib/fileSystem';
import { useExportDirectoryZip } from './useExportDirectoryZip';

const { exportDirectoryZipMock, saveStreamWithPickerMock, captureDiagnosticExceptionMock } =
  vi.hoisted(() => ({
    exportDirectoryZipMock: vi.fn(),
    saveStreamWithPickerMock: vi.fn(),
    captureDiagnosticExceptionMock: vi.fn(),
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

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
}));

type Producer = (write: (chunk: Uint8Array) => Promise<void>) => Promise<void>;

describe('useExportDirectoryZip', () => {
  beforeEach(() => {
    exportDirectoryZipMock.mockReset();
    saveStreamWithPickerMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
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

    const { exportDirectoryZip, state } = useExportDirectoryZip();
    await exportDirectoryZip('/repo');

    expect(written).toEqual([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]);
    expect(state.value).toEqual({ status: 'success', message: 'ZIP archive exported.' });
  });

  it('reports running progress including the client-owned saving phase', async () => {
    exportDirectoryZipMock.mockImplementation(
      (
        _path: string,
        _onChunk: (chunk: Uint8Array) => Promise<void>,
        onProgress: (p: unknown) => void,
      ) => {
        onProgress({ phase: 'reading', current: 1, total: 2 });
        return Promise.resolve();
      },
    );
    saveStreamWithPickerMock.mockImplementationOnce(async (produce: Producer) => {
      await produce(() => Promise.resolve());
      expect(state.value).toEqual({
        status: 'running',
        progress: { phase: 'saving' },
      });
      return true;
    });

    const { exportDirectoryZip, state } = useExportDirectoryZip();
    await exportDirectoryZip('/repo');
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

  it('returns to idle when the user cancels the save dialog', async () => {
    saveStreamWithPickerMock.mockResolvedValueOnce(false);

    const { exportDirectoryZip, state } = useExportDirectoryZip();

    await expect(exportDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({ status: 'idle' });
  });

  it('sets an error state and reports diagnostics for an unexpected export failure', async () => {
    const rawCause = new Error('boom');
    exportDirectoryZipMock.mockRejectedValueOnce(rawCause);

    const { exportDirectoryZip, state } = useExportDirectoryZip();

    await expect(exportDirectoryZip('/repo')).resolves.toBe(false);

    expect(state.value).toEqual({
      status: 'error',
      message: 'Could not export the directory as a ZIP archive',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(rawCause);
  });

  it('sets an error state using a DomainError message from the service', async () => {
    const cause = new DomainError('The document has no storage files to export.');
    exportDirectoryZipMock.mockRejectedValueOnce(cause);

    const { exportDirectoryZip, state } = useExportDirectoryZip();

    await expect(exportDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message: 'The document has no storage files to export.',
    });
  });

  it('reports diagnostics for an unexpected DomainError from the service', async () => {
    const cause = new DomainError('The document has no storage files to export.');
    exportDirectoryZipMock.mockRejectedValueOnce(cause);

    const { exportDirectoryZip, state } = useExportDirectoryZip();

    await expect(exportDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message: 'The document has no storage files to export.',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(cause, {
      feature: 'exportZip',
      action: 'exportDirectoryZip',
    });
  });

  it('shows the terminal error state without reporting diagnostics for the fallback-size limit', async () => {
    const cause = new DomainError('The archive is too large to save without direct disk access.', {
      code: FileSystemDomainErrorCode.saveStreamFallbackTooLarge,
    });
    saveStreamWithPickerMock.mockRejectedValueOnce(cause);

    const { exportDirectoryZip, state } = useExportDirectoryZip();

    await expect(exportDirectoryZip('/repo')).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message: 'The archive is too large to save without direct disk access.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('does not close the dialog while running, but closes it after success or error', async () => {
    let resolveFirst!: () => void;
    saveStreamWithPickerMock.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveFirst = () => {
            resolve(true);
          };
        }),
    );

    const { exportDirectoryZip, state, closeExportZipDialog } = useExportDirectoryZip();
    const running = exportDirectoryZip('/repo');

    closeExportZipDialog();
    expect(state.value).toEqual({ status: 'running' });

    resolveFirst();
    await running;

    closeExportZipDialog();
    expect(state.value).toEqual({ status: 'idle' });
  });
});
