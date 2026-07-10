import { describe, expect, it } from 'vitest';
import { compareByteStreams } from './repositoryZipImportRecovery';

const chunks = async function* (...values: number[][]): AsyncIterable<Uint8Array> {
  for (const value of values) {
    // eslint-disable-next-line no-await-in-loop -- fixture deliberately yields asynchronous chunks
    await Promise.resolve();
    yield new Uint8Array(value);
  }
};

describe('compareByteStreams', () => {
  it('matches equal streams with different chunk boundaries', async () => {
    await expect(compareByteStreams(chunks([1, 2], [3]), chunks([1], [2, 3]))).resolves.toBe(true);
  });

  it('rejects a differing middle byte', async () => {
    await expect(compareByteStreams(chunks([1, 2, 3]), chunks([1, 9, 3]))).resolves.toBe(false);
  });

  it('rejects either stream being shorter', async () => {
    await expect(compareByteStreams(chunks([1]), chunks([1, 2]))).resolves.toBe(false);
    await expect(compareByteStreams(chunks([1, 2]), chunks([1]))).resolves.toBe(false);
  });

  it('matches empty streams', async () => {
    await expect(compareByteStreams(chunks(), chunks())).resolves.toBe(true);
  });

  it('preserves a stream read failure', async () => {
    const failure = new Error('read failed');
    const failing = async function* (): AsyncIterable<Uint8Array> {
      await Promise.resolve();
      yield new Uint8Array([1]);
      throw failure;
    };
    await expect(compareByteStreams(failing(), chunks([1], [2]))).rejects.toBe(failure);
  });
});
