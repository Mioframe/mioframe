import { describe, expect, it } from 'vitest';
import { parseFileSystemUnavailableRootRecovery } from './fileSystemUnavailableRootRecovery';

const createSerializedUnavailableRootError = ({ spaceName }: { spaceName: string }) =>
  Object.assign(new Error('Mioframe cannot open this remembered folder anymore.'), {
    code: 'web-file-system-unavailable-root',
    name: 'WebFileSystemUnavailableRootError',
    spaceName,
  });

describe('fileSystemUnavailableRootRecovery', () => {
  it('accepts a valid serialized unavailable-root payload', () => {
    expect(
      parseFileSystemUnavailableRootRecovery(
        createSerializedUnavailableRootError({ spaceName: 'Work' }),
      ),
    ).toEqual({
      spaceName: 'Work',
    });
  });

  it('rejects a mismatched code', () => {
    expect(
      parseFileSystemUnavailableRootRecovery(
        Object.assign(new Error('Permission required'), {
          code: 'web-file-system-access-required',
          spaceName: 'Work',
        }),
      ),
    ).toBeUndefined();
  });

  it('rejects a non-string space name', () => {
    expect(
      parseFileSystemUnavailableRootRecovery(
        Object.assign(new Error('Unavailable'), {
          code: 'web-file-system-unavailable-root',
          spaceName: 42,
        }),
      ),
    ).toBeUndefined();
  });

  it('rejects unrelated values', () => {
    expect(parseFileSystemUnavailableRootRecovery(new Error('Something else'))).toBeUndefined();
    expect(parseFileSystemUnavailableRootRecovery(undefined)).toBeUndefined();
  });
});
