import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { FileSystemUnavailableRootRecovery } from '@shared/lib/fileSystem';
import { DomainError } from '@shared/lib/error';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';
import { useLocalDirectoryReconnectAction } from './useLocalDirectoryReconnectAction';

const { captureDiagnosticExceptionMock, reconnectDirectoryMock, showDirectoryPickerMock } =
  vi.hoisted(() => ({
    captureDiagnosticExceptionMock: vi.fn(),
    reconnectDirectoryMock: vi.fn(),
    showDirectoryPickerMock: vi.fn(),
  }));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    reconnectDirectory: reconnectDirectoryMock,
  }),
}));

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
}));

const createHandle = () => createDirectoryHandleMock({ name: 'Work' });

describe('useLocalDirectoryReconnectAction', () => {
  beforeEach(() => {
    captureDiagnosticExceptionMock.mockReset();
    reconnectDirectoryMock.mockReset();
    showDirectoryPickerMock.mockReset();
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('reconnects and clears the message on a confirmed same-entry selection', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'reconnected', name: 'Work' });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ recovery });

    const promise = reconnectFolder();
    expect(isReconnectPending.value).toBe(true);
    await promise;

    expect(isReconnectPending.value).toBe(false);
    expect(showDirectoryPickerMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(reconnectDirectoryMock).toHaveBeenCalledWith({ handle, spaceName: 'Work' });
    expect(reconnectMessage.value).toContain('Work');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('leaves persisted and runtime state untouched when the picker is cancelled', async () => {
    showDirectoryPickerMock.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'));
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { isReconnectPending, reconnectFolder } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(isReconnectPending.value).toBe(false);
    expect(reconnectDirectoryMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('wraps a non-cancel picker failure in a safe retryable DomainError instead of rejecting', async () => {
    const pickerError = new DOMException('permission dismissed by the browser', 'NotAllowedError');
    showDirectoryPickerMock.mockRejectedValueOnce(pickerError);
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ recovery });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(isReconnectPending.value).toBe(false);
    expect(reconnectDirectoryMock).not.toHaveBeenCalled();
    expect(reconnectMessage.value).toBe(
      'Could not open the folder picker. Try again from this action.',
    );
    expect(reconnectMessage.value).not.toContain('permission dismissed by the browser');

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      feature: 'localDirectoryRecovery',
      action: 'reconnectFolder',
    });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      message: 'Could not open the folder picker. Try again from this action.',
      code: 'localDirectoryReconnect.pickerFailed',
    });
    expect(reportedError.cause).toBe(pickerError);
    expect(reportedError.message).not.toContain('permission dismissed by the browser');
  });

  it('wraps an unexpected reconnectDirectory failure in a safe retryable DomainError instead of rejecting', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    const serviceError = new Error('vfs write conflict at /handles/Work.json');
    reconnectDirectoryMock.mockRejectedValueOnce(serviceError);
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ recovery });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(isReconnectPending.value).toBe(false);
    expect(reconnectMessage.value).toBe(
      'Could not reconnect this folder. Try again from this action.',
    );
    expect(reconnectMessage.value).not.toContain('vfs write conflict');

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      feature: 'localDirectoryRecovery',
      action: 'reconnectFolder',
    });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      code: 'localDirectoryReconnect.reconnectFailed',
    });
    expect(reportedError.cause).toBe(serviceError);
  });

  it('reports a retryable message without a diagnostic exception on a confirmed mismatch', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'mismatch' });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(reconnectMessage.value).toMatch(/different/i);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports a retryable message without a diagnostic exception when identity is unverified', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'identityUnverified' });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(reconnectMessage.value).toMatch(/could not confirm/i);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('resets pending state and ignores a stale result after the recovery target changes mid-flight', async () => {
    let resolvePicker: (handle: FileSystemDirectoryHandle) => void = () => {};
    showDirectoryPickerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePicker = resolve;
      }),
    );
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { isReconnectPending, reconnectFolder } = useLocalDirectoryReconnectAction({
      recovery,
    });

    const promise = reconnectFolder();
    recovery.value = { spaceName: 'Archive' };
    resolvePicker(createHandle());
    await promise;

    expect(isReconnectPending.value).toBe(false);
    expect(reconnectDirectoryMock).not.toHaveBeenCalled();
  });

  it('does not call the picker while a reconnect attempt is already pending', async () => {
    let resolvePicker: (handle: FileSystemDirectoryHandle) => void = () => {};
    showDirectoryPickerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePicker = resolve;
      }),
    );
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'reconnected', name: 'Work' });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ recovery });

    const firstAttempt = reconnectFolder();
    await reconnectFolder();
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);

    resolvePicker(createHandle());
    await firstAttempt;
  });
});
