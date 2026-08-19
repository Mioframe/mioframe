import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { DomainError } from '@shared/lib/error';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';
import { WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE } from '@shared/lib/webFileSystemProvider';
import { useLocalDirectoryReconnectAction } from './useLocalDirectoryReconnectAction';

const {
  captureDiagnosticExceptionMock,
  confirmMock,
  inspectMioframeSpaceDirectoryMock,
  reconnectDirectoryMock,
  relocateRememberedDirectoryMock,
  showDirectoryPickerMock,
} = vi.hoisted(() => ({
  captureDiagnosticExceptionMock: vi.fn(),
  confirmMock: vi.fn(),
  inspectMioframeSpaceDirectoryMock: vi.fn(),
  reconnectDirectoryMock: vi.fn(),
  relocateRememberedDirectoryMock: vi.fn(),
  showDirectoryPickerMock: vi.fn(),
}));

vi.mock('@entity/mountedDirectories', () => ({
  useFileSystem: () => ({
    reconnectDirectory: reconnectDirectoryMock,
    relocateRememberedDirectory: relocateRememberedDirectoryMock,
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

vi.mock('@shared/lib/automergeAdapter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/automergeAdapter')>();
  return {
    ...actual,
    inspectMioframeSpaceDirectory: inspectMioframeSpaceDirectoryMock,
  };
});

const createHandle = () => createDirectoryHandleMock({ name: 'Work' });

const createSerializedUnavailableRootError = (spaceName: string) =>
  Object.assign(new Error('Mioframe cannot open this remembered folder anymore.'), {
    code: WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE,
    name: 'WebFileSystemUnavailableRootError',
    spaceName,
  });

const errorsFor = (spaceName: string) =>
  ref<unknown[]>([createSerializedUnavailableRootError(spaceName)]);

describe('useLocalDirectoryReconnectAction', () => {
  beforeEach(() => {
    captureDiagnosticExceptionMock.mockReset();
    confirmMock.mockReset();
    inspectMioframeSpaceDirectoryMock.mockReset();
    reconnectDirectoryMock.mockReset();
    relocateRememberedDirectoryMock.mockReset();
    showDirectoryPickerMock.mockReset();
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: showDirectoryPickerMock,
    });
  });

  it('derives unavailable-root recovery from the supplied error candidates', () => {
    const errors = errorsFor('Work');

    const { hasUnavailableRootRecovery, reconnectMessage } = useLocalDirectoryReconnectAction({
      errors,
    });

    expect(hasUnavailableRootRecovery.value).toBe(true);
    expect(reconnectMessage.value).toContain('Work');
  });

  it('ignores unrelated errors', () => {
    const errors = ref<unknown[]>([new Error('unrelated failure')]);

    const { hasUnavailableRootRecovery } = useLocalDirectoryReconnectAction({ errors });

    expect(hasUnavailableRootRecovery.value).toBe(false);
  });

  it('reconnects, clears the message, and returns undefined on a confirmed same-entry selection', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'reconnected', name: 'Work' });
    const errors = errorsFor('Work');

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    expect(isReconnectPending.value).toBe(true);
    await expect(promise).resolves.toBeUndefined();

    expect(isReconnectPending.value).toBe(false);
    expect(showDirectoryPickerMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(reconnectDirectoryMock).toHaveBeenCalledWith({ handle, spaceName: 'Work' });
    expect(reconnectMessage.value).toContain('Work');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(inspectMioframeSpaceDirectoryMock).not.toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();
    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
  });

  it('leaves persisted and runtime state untouched when the picker is cancelled', async () => {
    showDirectoryPickerMock.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'));
    const errors = errorsFor('Work');

    const { isReconnectPending, reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(isReconnectPending.value).toBe(false);
    expect(reconnectDirectoryMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('wraps a non-cancel picker failure in a safe retryable DomainError instead of rejecting', async () => {
    const pickerError = new DOMException('permission dismissed by the browser', 'NotAllowedError');
    showDirectoryPickerMock.mockRejectedValueOnce(pickerError);
    const errors = errorsFor('Work');

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ errors });

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
      feature: 'localDirectoryReconnect',
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
    const errors = errorsFor('Work');

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(isReconnectPending.value).toBe(false);
    expect(reconnectMessage.value).toBe(
      'Could not reconnect this folder. Try again from this action.',
    );
    expect(reconnectMessage.value).not.toContain('vfs write conflict');

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      feature: 'localDirectoryReconnect',
      action: 'reconnectFolder',
    });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      code: 'localDirectoryReconnect.reconnectFailed',
    });
    expect(reportedError.cause).toBe(serviceError);
  });

  it('shows the pending-write warning and clears diagnostics for reconnectedWithWriteRecoveryFailure', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({
      status: 'reconnectedWithWriteRecoveryFailure',
      name: 'Work',
    });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe(
      'The folder is reconnected, but some pending changes could not be saved.',
    );
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(inspectMioframeSpaceDirectoryMock).not.toHaveBeenCalled();
  });

  it('reports missingRecord without a diagnostic exception when the same-entry reconnect target disappeared', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'missingRecord' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe('Mioframe no longer remembers this folder.');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('rejects a non-Mioframe candidate after confirmationRequired without mutation or diagnostics', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: false });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(inspectMioframeSpaceDirectoryMock).toHaveBeenCalledWith(handle);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
    expect(reconnectMessage.value).toBe(
      'That folder does not contain a Mioframe space. Choose the moved or renamed Mioframe folder.',
    );
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('opens explicit confirmation with the reconnect-as-new-location copy after confirmationRequired', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(false);
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Reconnect this Mioframe space?',
      supportingText:
        "Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will reconnect it as a new location and remove the unavailable remembered location. Unsaved in-memory changes from the unavailable location cannot be transferred.",
      confirmLabel: 'Reconnect',
      cancelLabel: 'Cancel',
    });
  });

  it('performs no relocation and no diagnostic exception when confirmation is cancelled', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(false);
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('calls relocateRememberedDirectory with the selected handle and current spaceName after confirmation, returning the new mounted name', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({
      status: 'relocated',
      name: 'Work (2)',
    });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBe('Work (2)');

    expect(relocateRememberedDirectoryMock).toHaveBeenCalledWith({ handle, spaceName: 'Work' });
    expect(reconnectMessage.value).toContain('Work');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('returns the existing mounted name and reports no diagnostic exception for alreadyMounted', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({
      status: 'alreadyMounted',
      name: 'Archive',
    });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBe('Archive');

    expect(reconnectMessage.value).toContain('Archive');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports missingRecord after a confirmed relocation whose remembered record disappeared', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({ status: 'missingRecord' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe('Mioframe no longer remembers this folder.');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('wraps an unexpected marker-inspection failure in a safe retryable DomainError', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    const inspectionError = new DOMException('permission denied at /handles/Work', 'SecurityError');
    inspectMioframeSpaceDirectoryMock.mockRejectedValueOnce(inspectionError);
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(confirmMock).not.toHaveBeenCalled();
    expect(reconnectMessage.value).toBe(
      'Could not inspect this folder. Try again from this action.',
    );
    expect(reconnectMessage.value).not.toContain('permission denied');

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError, options] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(options).toEqual({
      feature: 'localDirectoryReconnect',
      action: 'reconnectFolder',
    });
    expect(reportedError).toBeInstanceOf(DomainError);
    expect(reportedError).toMatchObject({
      code: 'localDirectoryReconnect.inspectFailed',
    });
    expect(reportedError.cause).toBe(inspectionError);
  });

  it('safely handles an unexpected relocation rejection without escaping the action promise', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: true });
    confirmMock.mockResolvedValueOnce(true);
    const serviceError = new Error('vfs write conflict at /handles/Work.json');
    relocateRememberedDirectoryMock.mockRejectedValueOnce(serviceError);
    const errors = errorsFor('Work');

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ errors });

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
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    errors.value = [createSerializedUnavailableRootError('Archive')];
    resolveInspection({ looksLikeExistingSpace: true });
    await promise;

    expect(confirmMock).not.toHaveBeenCalled();
    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
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
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    errors.value = [createSerializedUnavailableRootError('Archive')];
    resolveConfirm(true);
    await promise;

    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
  });

  it('resets pending state and ignores a stale result after the recovery target changes mid-flight', async () => {
    let resolvePicker: (handle: FileSystemDirectoryHandle) => void = () => {};
    showDirectoryPickerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePicker = resolve;
      }),
    );
    const errors = errorsFor('Work');

    const { isReconnectPending, reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    errors.value = [createSerializedUnavailableRootError('Archive')];
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
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const firstAttempt = reconnectFolder();
    await reconnectFolder();
    expect(showDirectoryPickerMock).toHaveBeenCalledTimes(1);

    resolvePicker(createHandle());
    await firstAttempt;
  });
});
