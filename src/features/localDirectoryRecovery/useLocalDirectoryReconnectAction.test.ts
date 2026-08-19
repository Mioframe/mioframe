import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { FileSystemUnavailableRootRecovery } from '@shared/lib/fileSystem';
import { DomainError } from '@shared/lib/error';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';
import { useLocalDirectoryReconnectAction } from './useLocalDirectoryReconnectAction';

const {
  captureDiagnosticExceptionMock,
  confirmMock,
  inspectMioframeSpaceDirectoryMock,
  reconnectDirectoryMock,
  replaceRememberedDirectoryMock,
  showDirectoryPickerMock,
} = vi.hoisted(() => ({
  captureDiagnosticExceptionMock: vi.fn(),
  confirmMock: vi.fn(),
  inspectMioframeSpaceDirectoryMock: vi.fn(),
  reconnectDirectoryMock: vi.fn(),
  replaceRememberedDirectoryMock: vi.fn(),
  showDirectoryPickerMock: vi.fn(),
}));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    reconnectDirectory: reconnectDirectoryMock,
    replaceRememberedDirectory: replaceRememberedDirectoryMock,
  }),
}));

vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: captureDiagnosticExceptionMock,
}));

vi.mock('@shared/ui/Dialog', () => ({
  useDialog: () => ({
    confirm: confirmMock,
  }),
}));

vi.mock('@shared/lib/fileSystem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/fileSystem')>();
  return {
    ...actual,
    inspectMioframeSpaceDirectory: inspectMioframeSpaceDirectoryMock,
  };
});

const createHandle = () => createDirectoryHandleMock({ name: 'Work' });

describe('useLocalDirectoryReconnectAction', () => {
  beforeEach(() => {
    captureDiagnosticExceptionMock.mockReset();
    confirmMock.mockReset();
    inspectMioframeSpaceDirectoryMock.mockReset();
    reconnectDirectoryMock.mockReset();
    replaceRememberedDirectoryMock.mockReset();
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
    expect(inspectMioframeSpaceDirectoryMock).not.toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();
    expect(replaceRememberedDirectoryMock).not.toHaveBeenCalled();
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

  it('reports missingRecord without a diagnostic exception', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'missingRecord' });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(reconnectMessage.value).toBe('Mioframe no longer remembers this folder.');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('rejects a non-Mioframe candidate after confirmationRequired without mutation or diagnostics', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: false });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(inspectMioframeSpaceDirectoryMock).toHaveBeenCalledWith(handle);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(replaceRememberedDirectoryMock).not.toHaveBeenCalled();
    expect(reconnectMessage.value).toBe(
      'That folder does not contain a Mioframe space. Choose the moved or renamed Mioframe folder.',
    );
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('opens explicit confirmation after confirmationRequired when the candidate is an existing Mioframe space', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(false);
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmLabel: 'Replace location',
        cancelLabel: 'Cancel',
      }),
    );
    const [confirmOptions] = confirmMock.mock.calls[0] ?? [];
    expect(confirmOptions.supportingText).toContain('"Work"');
  });

  it('performs no replacement and no diagnostic exception when confirmation is cancelled', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(false);
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ recovery });

    await reconnectFolder();

    expect(replaceRememberedDirectoryMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('calls replaceRememberedDirectory with the selected handle and current spaceName after confirmation', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(true);
    replaceRememberedDirectoryMock.mockResolvedValueOnce({ status: 'reconnected', name: 'Work' });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(replaceRememberedDirectoryMock).toHaveBeenCalledWith({ handle, spaceName: 'Work' });
    expect(reconnectMessage.value).toContain('Work');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports missingRecord after a confirmed replacement whose remembered record disappeared', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(true);
    replaceRememberedDirectoryMock.mockResolvedValueOnce({ status: 'missingRecord' });
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await reconnectFolder();

    expect(reconnectMessage.value).toBe('Mioframe no longer remembers this folder.');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('wraps an unexpected marker-inspection failure in a safe retryable DomainError', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    const inspectionError = new DOMException('permission denied at /handles/Work', 'SecurityError');
    inspectMioframeSpaceDirectoryMock.mockRejectedValueOnce(inspectionError);
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({
      recovery,
    });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(confirmMock).not.toHaveBeenCalled();
    expect(reconnectMessage.value).toBe(
      'Could not inspect this folder. Try again from this action.',
    );
    expect(reconnectMessage.value).not.toContain('permission denied');

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      feature: 'localDirectoryRecovery',
      action: 'reconnectFolder',
    });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      code: 'localDirectoryReconnect.inspectFailed',
    });
    expect(reportedError.cause).toBe(inspectionError);
  });

  it('safely handles an unexpected confirmed-replacement rejection without escaping the action promise', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(true);
    const serviceError = new Error('vfs write conflict at /handles/Work.json');
    replaceRememberedDirectoryMock.mockRejectedValueOnce(serviceError);
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
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      code: 'localDirectoryReconnect.reconnectFailed',
    });
    expect(reportedError.cause).toBe(serviceError);
  });

  it('ignores a stale recovery target that changed during marker inspection', async () => {
    let resolveInspection: (inspection: { looksLikeExistingSpace: boolean }) => void = () => {};
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveInspection = resolve;
      }),
    );
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ recovery });

    const promise = reconnectFolder();
    recovery.value = { spaceName: 'Archive' };
    resolveInspection({ looksLikeExistingSpace: true });
    await promise;

    expect(confirmMock).not.toHaveBeenCalled();
    expect(replaceRememberedDirectoryMock).not.toHaveBeenCalled();
  });

  it('ignores a stale recovery target that changed while confirmation was pending', async () => {
    let resolveConfirm: (confirmed: boolean) => void = () => {};
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );
    const recovery = ref<FileSystemUnavailableRootRecovery | undefined>({ spaceName: 'Work' });

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ recovery });

    const promise = reconnectFolder();
    recovery.value = { spaceName: 'Archive' };
    resolveConfirm(true);
    await promise;

    expect(replaceRememberedDirectoryMock).not.toHaveBeenCalled();
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
