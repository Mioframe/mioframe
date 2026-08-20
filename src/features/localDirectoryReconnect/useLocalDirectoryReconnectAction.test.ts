import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { DomainError } from '@shared/lib/error';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';
import { WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE } from '@shared/lib/webFileSystemProvider';
import { useLocalDirectoryReconnectAction } from './useLocalDirectoryReconnectAction';

const {
  addSnackbarMock,
  automergeAdapterInspectMock,
  captureDiagnosticExceptionMock,
  confirmMock,
  reconnectDirectoryMock,
  relocateRememberedDirectoryMock,
  showDirectoryPickerMock,
} = vi.hoisted(() => ({
  addSnackbarMock: vi.fn(),
  automergeAdapterInspectMock: vi.fn(),
  captureDiagnosticExceptionMock: vi.fn(),
  confirmMock: vi.fn(),
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

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

// Marker inspection now belongs to the fileSystem service, not this feature. Keeping this spy in
// place (and asserting it is never called) proves the feature no longer imports or inspects
// marker files directly.
vi.mock('@shared/lib/automergeAdapter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/automergeAdapter')>();
  return {
    ...actual,
    inspectMioframeSpaceDirectory: automergeAdapterInspectMock,
  };
});

const createHandle = () => createDirectoryHandleMock({ name: 'Work' });

const createSerializedUnavailableRootError = ({
  recoveryKey,
  spaceName,
}: {
  recoveryKey: string;
  spaceName: string;
}) =>
  Object.assign(new Error('Mioframe cannot open this remembered folder anymore.'), {
    code: WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE,
    name: 'WebFileSystemUnavailableRootError',
    spaceName,
    recoveryKey,
  });

const errorsFor = (spaceName: string, recoveryKey = 'key-1') =>
  ref<unknown[]>([createSerializedUnavailableRootError({ spaceName, recoveryKey })]);

describe('useLocalDirectoryReconnectAction', () => {
  beforeEach(() => {
    addSnackbarMock.mockReset();
    automergeAdapterInspectMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
    confirmMock.mockReset();
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
    const errors = errorsFor('Work', 'key-1');

    const { isReconnectPending, reconnectFolder, reconnectMessage } =
      useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    expect(isReconnectPending.value).toBe(true);
    await expect(promise).resolves.toBeUndefined();

    expect(isReconnectPending.value).toBe(false);
    expect(showDirectoryPickerMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(reconnectDirectoryMock).toHaveBeenCalledWith({
      handle,
      spaceName: 'Work',
      recoveryKey: 'key-1',
    });
    expect(reconnectMessage.value).toContain('Work');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();
    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
    expect(automergeAdapterInspectMock).not.toHaveBeenCalled();
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

  it('preserves an already-safe DomainError from reconnectDirectory instead of masking its message', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    const safeError = new DomainError(
      'Could not inspect this folder. Try again from this action.',
      {
        cause: new Error('raw marker-read failure'),
        code: 'fileSystem.markerInspectionFailed',
      },
    );
    reconnectDirectoryMock.mockRejectedValueOnce(safeError);
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe(
      'Could not inspect this folder. Try again from this action.',
    );
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    const [reportedError] = captureDiagnosticExceptionMock.mock.calls[0] ?? [];
    expect(reportedError).toBe(safeError);
  });

  it('shows the pending-write warning through Snackbar for reconnectedWithWriteRecoveryFailure, independent of the recovery empty-state', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({
      status: 'reconnectedWithWriteRecoveryFailure',
      name: 'Work',
    });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'The folder is reconnected, but some pending changes could not be saved.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();

    // The warning does not depend on the unavailable-root empty-state staying rendered: it is
    // expected to disappear once the folder reconnects successfully.
    errors.value = [];
    expect(addSnackbarMock).toHaveBeenCalledTimes(1);
    expect(reconnectMessage.value).toBe('');
  });

  it('shows the pending-write warning through Snackbar even when the unavailable-root recovery disappears because the reconnect itself committed', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    const errors = errorsFor('Work');

    reconnectDirectoryMock.mockImplementationOnce(() => {
      // The mutation itself is what makes the unavailable-root recovery disappear.
      errors.value = [];
      return Promise.resolve({ status: 'reconnectedWithWriteRecoveryFailure', name: 'Work' });
    });

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'The folder is reconnected, but some pending changes could not be saved.',
    });
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports missingRecord without a diagnostic exception when the reconnect target disappeared', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'missingRecord' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe('Mioframe no longer remembers this folder.');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports staleRecovery without a diagnostic exception when the reconnect target is no longer current', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'staleRecovery' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe(
      'This folder recovery is no longer available. Try again from this action.',
    );
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports invalidCandidate directly from reconnectDirectory without opening confirmation', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'invalidCandidate' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(confirmMock).not.toHaveBeenCalled();
    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
    expect(reconnectMessage.value).toBe(
      'That folder does not contain a Mioframe space. Choose the moved or renamed Mioframe folder.',
    );
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
    expect(automergeAdapterInspectMock).not.toHaveBeenCalled();
  });

  it('opens explicit confirmation with the reconnect-as-new-location copy after confirmationRequired', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(false);
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Reconnect this Mioframe space?',
      supportingText:
        "Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will reconnect the selected space without transferring unsaved in-memory changes from the unavailable location.",
      confirmLabel: 'Reconnect',
      cancelLabel: 'Cancel',
    });
    expect(automergeAdapterInspectMock).not.toHaveBeenCalled();
  });

  it('uses the same confirmation copy for the alreadyMounted zero-mutation outcome, without promising removal', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({
      status: 'alreadyMounted',
      name: 'Archive',
    });
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();

    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Reconnect this Mioframe space?',
      supportingText:
        "Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will reconnect the selected space without transferring unsaved in-memory changes from the unavailable location.",
      confirmLabel: 'Reconnect',
      cancelLabel: 'Cancel',
    });
    expect(confirmMock.mock.calls[0]?.[0].supportingText).not.toContain('remove');
  });

  it('performs no relocation and no diagnostic exception when confirmation is cancelled', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(false);
    const errors = errorsFor('Work');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('calls relocateRememberedDirectory with the selected handle, current spaceName, and recoveryKey after confirmation, returning the new mounted name', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({
      status: 'relocated',
      name: 'Work (2)',
    });
    const errors = errorsFor('Work', 'key-1');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBe('Work (2)');

    expect(relocateRememberedDirectoryMock).toHaveBeenCalledWith({
      handle,
      spaceName: 'Work',
      recoveryKey: 'key-1',
    });
    expect(reconnectMessage.value).toContain('Work');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('returns the existing mounted name and reports no diagnostic exception for alreadyMounted', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
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
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({ status: 'missingRecord' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe('Mioframe no longer remembers this folder.');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports staleRecovery after a confirmed relocation whose target is no longer current', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({ status: 'staleRecovery' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe(
      'This folder recovery is no longer available. Try again from this action.',
    );
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('reports invalidCandidate after a confirmed relocation whose marker disappeared during confirmation', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    relocateRememberedDirectoryMock.mockResolvedValueOnce({ status: 'invalidCandidate' });
    const errors = errorsFor('Work');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();

    expect(reconnectMessage.value).toBe(
      'That folder does not contain a Mioframe space. Choose the moved or renamed Mioframe folder.',
    );
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('preserves a committed relocation result even when its source recovery disappears because the relocation itself committed', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    const errors = errorsFor('Work');

    relocateRememberedDirectoryMock.mockImplementationOnce(() => {
      // The mutation itself is what makes the source unavailable-root recovery disappear.
      errors.value = [];
      return Promise.resolve({ status: 'relocated', name: 'Work (2)' });
    });

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBe('Work (2)');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('applies no navigation target and no stale feedback for a delayed alreadyMounted result whose source recovery disappeared', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    const errors = errorsFor('Work', 'key-1');

    relocateRememberedDirectoryMock.mockImplementationOnce(() => {
      // `alreadyMounted` is zero-mutation: recovery disappearing before the result is applied
      // must not produce stale navigation or feedback.
      errors.value = [];
      return Promise.resolve({ status: 'alreadyMounted', name: 'Archive' });
    });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();
    expect(reconnectMessage.value).not.toContain('Archive');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('applies no navigation target and no stale feedback for a delayed alreadyMounted result after the same spaceName gets a different recoveryKey', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    const errors = errorsFor('Work', 'key-1');

    relocateRememberedDirectoryMock.mockImplementationOnce(() => {
      // Same mounted name, but a different provider instance (a different recoveryKey) is a
      // different target: the delayed alreadyMounted result must not overwrite its feedback.
      errors.value = [
        createSerializedUnavailableRootError({ spaceName: 'Work', recoveryKey: 'key-2' }),
      ];
      return Promise.resolve({ status: 'alreadyMounted', name: 'Archive' });
    });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await expect(reconnectFolder()).resolves.toBeUndefined();
    expect(reconnectMessage.value).not.toContain('Archive');
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('safely handles an unexpected relocation rejection without escaping the action promise', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
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

  it('preserves target-local feedback when an equivalent recovery object for the same recoveryKey is re-emitted', async () => {
    const pickerError = new DOMException('permission dismissed by the browser', 'NotAllowedError');
    showDirectoryPickerMock.mockRejectedValueOnce(pickerError);
    const errors = errorsFor('Work', 'key-1');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();
    expect(reconnectMessage.value).toBe(
      'Could not open the folder picker. Try again from this action.',
    );

    // A reactive reread re-emits a semantically identical recovery for the same mounted
    // provider (same recoveryKey); it must not clear the existing retry message.
    errors.value = [
      createSerializedUnavailableRootError({ spaceName: 'Work', recoveryKey: 'key-1' }),
    ];

    expect(reconnectMessage.value).toBe(
      'Could not open the folder picker. Try again from this action.',
    );
  });

  it('treats the same spaceName with a different recoveryKey as a different target and clears feedback', async () => {
    const pickerError = new DOMException('permission dismissed by the browser', 'NotAllowedError');
    showDirectoryPickerMock.mockRejectedValueOnce(pickerError);
    const errors = errorsFor('Work', 'key-1');

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();
    expect(reconnectMessage.value).toBe(
      'Could not open the folder picker. Try again from this action.',
    );

    // Same mounted name, but a different provider (e.g. it was removed and re-added): a
    // different recoveryKey is a different target, so feedback is cleared.
    errors.value = [
      createSerializedUnavailableRootError({ spaceName: 'Work', recoveryKey: 'key-2' }),
    ];
    await nextTick();

    expect(reconnectMessage.value).not.toBe(
      'Could not open the folder picker. Try again from this action.',
    );
  });

  it('prevents reconnectDirectory() when the same spaceName gets a new recoveryKey while the picker is pending', async () => {
    let resolvePicker: (handle: FileSystemDirectoryHandle) => void = () => {};
    showDirectoryPickerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePicker = resolve;
      }),
    );
    const errors = errorsFor('Work', 'key-1');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    errors.value = [
      createSerializedUnavailableRootError({ spaceName: 'Work', recoveryKey: 'key-2' }),
    ];
    resolvePicker(createHandle());
    await promise;

    expect(reconnectDirectoryMock).not.toHaveBeenCalled();
  });

  it('prevents relocateRememberedDirectory() when the same spaceName gets a new recoveryKey while confirmation is pending', async () => {
    let resolveConfirm: (confirmed: boolean) => void = () => {};
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );
    const errors = errorsFor('Work', 'key-1');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    errors.value = [
      createSerializedUnavailableRootError({ spaceName: 'Work', recoveryKey: 'key-2' }),
    ];
    resolveConfirm(true);
    await promise;

    expect(relocateRememberedDirectoryMock).not.toHaveBeenCalled();
  });

  it('does not apply a delayed missingRecord result from reconnectDirectory() after the target changes', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    const errors = errorsFor('Work', 'key-1');

    reconnectDirectoryMock.mockImplementationOnce(() => {
      // The initiating target changes to another recoveryKey while this zero-mutation result is
      // still in flight.
      errors.value = [
        createSerializedUnavailableRootError({ spaceName: 'Archive', recoveryKey: 'key-3' }),
      ];
      return Promise.resolve({ status: 'missingRecord' });
    });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();

    expect(reconnectMessage.value).not.toBe('Mioframe no longer remembers this folder.');
    expect(reconnectMessage.value).toContain('Archive');
  });

  it('does not apply a delayed staleRecovery/invalidCandidate result from reconnectDirectory() after the target changes', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    const errors = errorsFor('Work', 'key-1');

    reconnectDirectoryMock.mockImplementationOnce(() => {
      errors.value = [
        createSerializedUnavailableRootError({ spaceName: 'Archive', recoveryKey: 'key-3' }),
      ];
      return Promise.resolve({ status: 'staleRecovery' });
    });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();

    expect(reconnectMessage.value).not.toBe(
      'This folder recovery is no longer available. Try again from this action.',
    );
    expect(reconnectMessage.value).toContain('Archive');
  });

  it('does not apply a delayed missingRecord result from relocateRememberedDirectory() after the target changes', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    const errors = errorsFor('Work', 'key-1');

    relocateRememberedDirectoryMock.mockImplementationOnce(() => {
      errors.value = [
        createSerializedUnavailableRootError({ spaceName: 'Archive', recoveryKey: 'key-3' }),
      ];
      return Promise.resolve({ status: 'missingRecord' });
    });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();

    expect(reconnectMessage.value).not.toBe('Mioframe no longer remembers this folder.');
    expect(reconnectMessage.value).toContain('Archive');
  });

  it('does not apply a delayed alreadyMounted-adjacent staleRecovery result from relocateRememberedDirectory() after the target changes', async () => {
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockResolvedValueOnce(true);
    const errors = errorsFor('Work', 'key-1');

    relocateRememberedDirectoryMock.mockImplementationOnce(() => {
      errors.value = [
        createSerializedUnavailableRootError({ spaceName: 'Archive', recoveryKey: 'key-3' }),
      ];
      return Promise.resolve({ status: 'staleRecovery' });
    });

    const { reconnectFolder, reconnectMessage } = useLocalDirectoryReconnectAction({ errors });

    await reconnectFolder();

    expect(reconnectMessage.value).not.toBe(
      'This folder recovery is no longer available. Try again from this action.',
    );
    expect(reconnectMessage.value).toContain('Archive');
  });

  it('continues past the picker checkpoint when a new recovery object for the same recoveryKey is emitted', async () => {
    let resolvePicker: (handle: FileSystemDirectoryHandle) => void = () => {};
    showDirectoryPickerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePicker = resolve;
      }),
    );
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'reconnected', name: 'Work' });
    const errors = errorsFor('Work', 'key-1');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    // A reactive reread re-emits a semantically identical recovery for the same mounted
    // provider; it must not be treated as a stale-target change.
    errors.value = [
      createSerializedUnavailableRootError({ spaceName: 'Work', recoveryKey: 'key-1' }),
    ];
    resolvePicker(createHandle());
    await promise;

    expect(reconnectDirectoryMock).toHaveBeenCalledWith({
      handle: expect.anything(),
      spaceName: 'Work',
      recoveryKey: 'key-1',
    });
  });

  it('continues past the confirmation checkpoint when a new recovery object for the same recoveryKey is emitted', async () => {
    let resolveConfirm: (confirmed: boolean) => void = () => {};
    const handle = createHandle();
    showDirectoryPickerMock.mockResolvedValueOnce(handle);
    reconnectDirectoryMock.mockResolvedValueOnce({ status: 'confirmationRequired' });
    confirmMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );
    relocateRememberedDirectoryMock.mockResolvedValueOnce({
      status: 'relocated',
      name: 'Work (2)',
    });
    const errors = errorsFor('Work', 'key-1');

    const { reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    errors.value = [
      createSerializedUnavailableRootError({ spaceName: 'Work', recoveryKey: 'key-1' }),
    ];
    resolveConfirm(true);
    await expect(promise).resolves.toBe('Work (2)');

    expect(relocateRememberedDirectoryMock).toHaveBeenCalledWith({
      handle,
      spaceName: 'Work',
      recoveryKey: 'key-1',
    });
  });

  it('resets pending state and ignores a stale result after the recovery target changes mid-flight', async () => {
    let resolvePicker: (handle: FileSystemDirectoryHandle) => void = () => {};
    showDirectoryPickerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePicker = resolve;
      }),
    );
    const errors = errorsFor('Work', 'key-1');

    const { isReconnectPending, reconnectFolder } = useLocalDirectoryReconnectAction({ errors });

    const promise = reconnectFolder();
    errors.value = [
      createSerializedUnavailableRootError({ spaceName: 'Archive', recoveryKey: 'key-3' }),
    ];
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
