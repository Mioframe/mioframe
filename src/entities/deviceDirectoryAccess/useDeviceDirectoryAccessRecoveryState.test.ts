import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import { useDeviceDirectoryAccessRecoveryState } from './useDeviceDirectoryAccessRecoveryState';

describe('useDeviceDirectoryAccessRecoveryState', () => {
  it('derives the stable access key from provider-owned readwrite access errors', () => {
    const error = new WebFileSystemAccessRequiredError({
      spaceName: 'Work',
      mode: 'readwrite',
    });
    const errors = ref<unknown[]>([error]);

    const { state } = useDeviceDirectoryAccessRecoveryState({ errors });

    expect(state.value).toEqual({
      operation: 'write',
      spaceName: 'Work',
    });
  });

  it('derives the stable access key from provider-owned read access errors', () => {
    const error = new WebFileSystemAccessRequiredError({
      spaceName: 'Archive',
      mode: 'read',
    });
    const errors = ref<unknown[]>([error]);

    const { state } = useDeviceDirectoryAccessRecoveryState({ errors });

    expect(state.value).toEqual({
      operation: 'read',
      spaceName: 'Archive',
    });
  });

  it('ignores non-recovery errors', () => {
    const { state } = useDeviceDirectoryAccessRecoveryState({
      errors: ref<unknown[]>([new Error('nope')]),
    });

    expect(state.value).toBeUndefined();
  });

  it('accepts the transfer-safe plain-object access error shape', () => {
    const plainError = Object.assign(
      new Error('Permission required to open this remembered local space'),
      {
        code: 'web-file-system-access-required',
        mode: 'readwrite',
        name: 'WebFileSystemAccessRequiredError',
        spaceName: 'Archive',
      },
    );
    const { state } = useDeviceDirectoryAccessRecoveryState({
      errors: ref<unknown[]>([plainError]),
    });

    expect(state.value).toEqual({ operation: 'write', spaceName: 'Archive' });
  });

  it('accepts plain-object recovery payload with mode:read', () => {
    const plainError = Object.assign(
      new Error('Permission required to open this remembered local space'),
      {
        code: 'web-file-system-access-required',
        mode: 'read',
        name: 'WebFileSystemAccessRequiredError',
        spaceName: 'Archive',
      },
    );
    const { state } = useDeviceDirectoryAccessRecoveryState({
      errors: ref<unknown[]>([plainError]),
    });

    expect(state.value).toEqual({ operation: 'read', spaceName: 'Archive' });
  });

  it('rejects malformed plain-object recovery payloads', () => {
    const malformedMode = Object.assign(
      new Error('Permission required to open this remembered local space'),
      {
        code: 'web-file-system-access-required',
        mode: 'write',
        name: 'WebFileSystemAccessRequiredError',
        spaceName: 'Archive',
      },
    );
    const { state: stateWithMalformedMode } = useDeviceDirectoryAccessRecoveryState({
      errors: ref<unknown[]>([malformedMode]),
    });
    expect(stateWithMalformedMode.value).toBeUndefined();

    const malformedSpaceName = Object.assign(
      new Error('Permission required to open this remembered local space'),
      {
        code: 'web-file-system-access-required',
        mode: 'readwrite',
        name: 'WebFileSystemAccessRequiredError',
        spaceName: 123,
      },
    );
    const { state: stateWithMalformedSpaceName } = useDeviceDirectoryAccessRecoveryState({
      errors: ref<unknown[]>([malformedSpaceName]),
    });
    expect(stateWithMalformedSpaceName.value).toBeUndefined();
  });

  it('filters by operation when specified', () => {
    const writeError = new WebFileSystemAccessRequiredError({
      spaceName: 'Work',
      mode: 'readwrite',
    });
    const errors = ref<unknown[]>([writeError]);

    const { state: readState } = useDeviceDirectoryAccessRecoveryState({
      errors,
      operation: ref<'read' | 'write' | undefined>('read'),
    });
    expect(readState.value).toBeUndefined();

    const { state: writeState } = useDeviceDirectoryAccessRecoveryState({
      errors,
      operation: ref<'read' | 'write' | undefined>('write'),
    });
    expect(writeState.value).toEqual({ operation: 'write', spaceName: 'Work' });
  });
});
