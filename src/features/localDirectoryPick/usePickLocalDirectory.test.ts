import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { usePickLocalDirectory } from './usePickLocalDirectory';

const {
  addDeviceDirectoryMock,
  addSnackbarMock,
  alertMock,
  captureDiagnosticExceptionMock,
  showDirectoryPickerMock,
} = vi.hoisted(() => ({
  addDeviceDirectoryMock: vi.fn(),
  addSnackbarMock: vi.fn(),
  alertMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
  showDirectoryPickerMock: vi.fn(),
}));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    addDeviceDirectory: addDeviceDirectoryMock,
  }),
}));

vi.mock('@shared/ui/Dialog', () => ({
  useDialog: () => ({
    alert: alertMock,
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
}));

describe('usePickLocalDirectory', () => {
  beforeEach(() => {
    addDeviceDirectoryMock.mockReset();
    addSnackbarMock.mockReset();
    alertMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    showDirectoryPickerMock.mockReset();
    alertMock.mockResolvedValue(undefined);
    addDeviceDirectoryMock.mockResolvedValue(undefined);
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('reports a privacy-safe DomainError when the directory picker fails with a raw path message', async () => {
    const rawCause = new DOMException(
      'Could not access /Device files/Private/Taxes 2025',
      'NotAllowedError',
    );
    showDirectoryPickerMock.mockRejectedValueOnce(rawCause);

    const { pickLocalDirectory } = usePickLocalDirectory();

    await expect(pickLocalDirectory()).resolves.toBeUndefined();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not add the folder',
    });
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      feature: 'localDirectoryPick',
      action: 'pickLocalDirectory',
    });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      message: 'Could not add the folder',
      cause: expect.objectContaining({
        message: 'Directory picker operation failed',
      }),
    });
    if (!(reportedError instanceof DomainError)) {
      throw new Error('Expected DomainError');
    }
    expect(reportedError.cause).not.toMatchObject({
      message: rawCause.message,
    });
  });
});
