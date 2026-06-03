import { describe, expect, it } from 'vitest';
import {
  getFileSystemAccessRecovery,
  parseFileSystemAccessRecovery,
} from './fileSystemAccessRecovery';

const createSerializedRecoveryError = ({
  mode,
  spaceName,
}: {
  mode: 'read' | 'readwrite';
  spaceName: string;
}) =>
  Object.assign(new Error('Permission required to open this remembered local space'), {
    code: 'web-file-system-access-required',
    mode,
    name: 'WebFileSystemAccessRequiredError',
    spaceName,
  });

describe('fileSystemAccessRecovery', () => {
  it('accepts valid serialized read recovery payloads', () => {
    expect(
      parseFileSystemAccessRecovery(
        createSerializedRecoveryError({
          mode: 'read',
          spaceName: 'Work',
        }),
      ),
    ).toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
  });

  it('accepts valid serialized write recovery payloads', () => {
    expect(
      getFileSystemAccessRecovery(
        createSerializedRecoveryError({
          mode: 'readwrite',
          spaceName: 'Archive',
        }),
      ),
    ).toEqual({
      operation: 'write',
      spaceName: 'Archive',
    });
  });

  it('rejects malformed recovery payloads', () => {
    expect(
      parseFileSystemAccessRecovery(
        Object.assign(new Error('Permission required'), {
          code: 'web-file-system-access-required',
          mode: 'write',
          spaceName: 'Work',
        }),
      ),
    ).toBeUndefined();
    expect(
      parseFileSystemAccessRecovery(
        Object.assign(new Error('Permission required'), {
          code: 'web-file-system-access-required',
          mode: 'read',
          spaceName: 42,
        }),
      ),
    ).toBeUndefined();
    expect(
      parseFileSystemAccessRecovery(
        Object.assign(new Error('Permission required'), {
          code: 'different-code',
          mode: 'read',
          spaceName: 'Work',
        }),
      ),
    ).toBeUndefined();
  });

  it('uses the same generic parser for read and write operation filtering', () => {
    const readError = createSerializedRecoveryError({
      mode: 'read',
      spaceName: 'Work',
    });
    const writeError = createSerializedRecoveryError({
      mode: 'readwrite',
      spaceName: 'Work',
    });

    expect(getFileSystemAccessRecovery(readError, { operation: 'read' })).toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
    expect(getFileSystemAccessRecovery(readError, { operation: 'write' })).toBeUndefined();
    expect(getFileSystemAccessRecovery(writeError, { operation: 'write' })).toEqual({
      operation: 'write',
      spaceName: 'Work',
    });
  });
});
