import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import {
  getDeviceDirectoryAccessRecoveryError,
  useDeviceDirectoryAccessRecoveryState,
} from './useDeviceDirectoryAccessRecoveryState';

describe('useDeviceDirectoryAccessRecoveryState', () => {
  it('derives the stable access key from provider-owned access errors', () => {
    const error = new WebFileSystemAccessRequiredError({
      spaceName: 'Work',
      mode: 'readwrite',
    });
    const errorList = [error];
    const errors = ref<unknown[]>(errorList);

    const { state } = useDeviceDirectoryAccessRecoveryState({
      errors,
    });

    expect(getDeviceDirectoryAccessRecoveryError(errorList)).toBe(error);
    expect(state.value).toEqual({
      mode: 'readwrite',
      spaceName: 'Work',
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

    expect(getDeviceDirectoryAccessRecoveryError([plainError])).toBe(plainError);
  });

  it('rejects malformed plain-object recovery payloads', () => {
    expect(
      getDeviceDirectoryAccessRecoveryError([
        {
          code: 'web-file-system-access-required',
          message: 'Permission required to open this remembered local space',
          mode: 'read',
          name: 'WebFileSystemAccessRequiredError',
          spaceName: 'Archive',
        },
      ]),
    ).toBeUndefined();
    expect(
      getDeviceDirectoryAccessRecoveryError([
        {
          code: 'web-file-system-access-required',
          message: 'Permission required to open this remembered local space',
          mode: 'readwrite',
          name: 'WebFileSystemAccessRequiredError',
          spaceName: 123,
        },
      ]),
    ).toBeUndefined();
  });
});
