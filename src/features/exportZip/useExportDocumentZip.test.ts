import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { zodDocumentId } from '@shared/lib/automerge';
import { FileSystemDomainErrorCode } from '@shared/lib/fileSystem';
import { useExportDocumentZip } from './useExportDocumentZip';

const { exportDocumentZipMock, saveStreamWithPickerMock, captureDiagnosticExceptionMock } =
  vi.hoisted(() => ({
    exportDocumentZipMock: vi.fn(),
    saveStreamWithPickerMock: vi.fn(),
    captureDiagnosticExceptionMock: vi.fn(),
  }));

const documentId = zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu');

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    repositories: {
      exportDocumentZip: exportDocumentZipMock,
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

describe('useExportDocumentZip', () => {
  beforeEach(() => {
    exportDocumentZipMock.mockReset();
    saveStreamWithPickerMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    exportDocumentZipMock.mockResolvedValue(undefined);
    saveStreamWithPickerMock.mockImplementation(async (produce: Producer) => {
      await produce(() => Promise.resolve());
      return true;
    });
  });

  it('suggests the document id as the filename', async () => {
    const { exportDocumentZip } = useExportDocumentZip();

    await exportDocumentZip('/documents', documentId);

    expect(saveStreamWithPickerMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        fileName: `${documentId}.zip`,
        extensions: ['.zip'],
        mimeTypes: ['application/zip'],
      }),
    );
    expect(exportDocumentZipMock).toHaveBeenCalledWith(
      '/documents',
      documentId,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('leaves the dialog state in success with the document export message', async () => {
    const { exportDocumentZip, state } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(true);
    expect(state.value).toEqual({
      status: 'success',
      message: 'ZIP exported with this document’s source storage files.',
    });
  });

  it('tracks isRunning for the duration of the export, ignoring duplicate starts', async () => {
    let resolveFirst!: () => void;
    saveStreamWithPickerMock.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveFirst = () => {
            resolve(true);
          };
        }),
    );

    const { exportDocumentZip, isRunning } = useExportDocumentZip();
    const firstCall = exportDocumentZip('/documents', documentId);

    expect(isRunning.value).toBe(true);

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);
    expect(saveStreamWithPickerMock).toHaveBeenCalledOnce();

    resolveFirst();
    await firstCall;

    expect(isRunning.value).toBe(false);
  });

  it('returns to idle when the user cancels the save dialog', async () => {
    saveStreamWithPickerMock.mockResolvedValueOnce(false);

    const { exportDocumentZip, state } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);
    expect(state.value).toEqual({ status: 'idle' });
  });

  it('sets an error state using a DomainError message from the service, e.g. no storage files', async () => {
    const cause = new DomainError('The document has no storage files to export.');
    exportDocumentZipMock.mockRejectedValueOnce(cause);

    const { exportDocumentZip, state } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message: 'The document has no storage files to export.',
    });
  });

  it('sets an error state and reports diagnostics for an unexpected export failure', async () => {
    const rawCause = new Error('boom');
    exportDocumentZipMock.mockRejectedValueOnce(rawCause);

    const { exportDocumentZip, state } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);

    expect(state.value).toEqual({
      status: 'error',
      message: 'Could not export the document as a ZIP archive',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError.cause).toBe(rawCause);
  });

  it('reports diagnostics for an unexpected DomainError from the service', async () => {
    const cause = new DomainError('The document has no storage files to export.');
    exportDocumentZipMock.mockRejectedValueOnce(cause);

    const { exportDocumentZip, state } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message: 'The document has no storage files to export.',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(cause, {
      feature: 'exportZip',
      action: 'exportDocumentZip',
    });
  });

  it('shows the terminal error state without reporting diagnostics for the fallback-size limit', async () => {
    const cause = new DomainError('The archive is too large to save without direct disk access.', {
      code: FileSystemDomainErrorCode.saveStreamFallbackTooLarge,
    });
    saveStreamWithPickerMock.mockRejectedValueOnce(cause);

    const { exportDocumentZip, state } = useExportDocumentZip();

    await expect(exportDocumentZip('/documents', documentId)).resolves.toBe(false);
    expect(state.value).toEqual({
      status: 'error',
      message: 'The archive is too large to save without direct disk access.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('does not close the dialog while running, but closes it after success', async () => {
    let resolveFirst!: () => void;
    saveStreamWithPickerMock.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveFirst = () => {
            resolve(true);
          };
        }),
    );

    const { exportDocumentZip, state, closeExportZipDialog } = useExportDocumentZip();
    const running = exportDocumentZip('/documents', documentId);

    closeExportZipDialog();
    expect(state.value).toEqual({ status: 'running' });

    resolveFirst();
    await running;

    closeExportZipDialog();
    expect(state.value).toEqual({ status: 'idle' });
  });
});
