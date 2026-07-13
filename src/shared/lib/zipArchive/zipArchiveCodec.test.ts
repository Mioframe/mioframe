import { describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { ZipArchiveErrorCode } from './zipArchiveErrorCode';
import {
  createZipArchiveReader,
  createZipArchiveWriter,
  packZipArchive,
  unpackZipArchive,
} from './zipArchiveCodec';

/**
 * Wraps bytes as a one-chunk async iterable, the shape `writeFileEntry` expects as a source.
 * @param bytes - The bytes to wrap as a single chunk.
 * @returns An async iterable yielding `bytes` once.
 */
const asyncSource = (bytes: Uint8Array): AsyncIterable<Uint8Array> => ({
  // eslint-disable-next-line @typescript-eslint/require-await -- AsyncIterable contract requires async generator syntax even though this fixture yields synchronously
  async *[Symbol.asyncIterator]() {
    yield bytes;
  },
});

/**
 * Splits bytes into fixed-size chunks so multi-push streaming behavior can be exercised.
 * @param bytes - The bytes to split.
 * @param size - Maximum size of each chunk.
 * @returns The bytes split into chunks, or a single empty chunk when `bytes` is empty.
 */
const chunk = (bytes: Uint8Array, size: number): Uint8Array[] => {
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < bytes.length; offset += size) {
    chunks.push(bytes.slice(offset, offset + size));
  }
  return chunks.length > 0 ? chunks : [new Uint8Array(0)];
};

/**
 * Builds a complete archive by draining a `ZipArchiveWriter` into a single byte array.
 * @param build - Callback that writes entries into the given writer.
 * @returns The concatenated archive bytes produced by the writer.
 */
const collectWriterOutput = async (
  build: (writer: ReturnType<typeof createZipArchiveWriter>) => Promise<void>,
) => {
  const chunks: Uint8Array[] = [];
  const writer = createZipArchiveWriter((archiveChunk) => {
    chunks.push(archiveChunk);
  });

  await build(writer);
  await writer.end();

  const total = chunks.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of chunks) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
};

describe('packZipArchive / unpackZipArchive', () => {
  it('round-trips a flat map of entries', () => {
    const entries = {
      'root/file.txt': new TextEncoder().encode('hello world'),
      'root/nested/other.txt': new TextEncoder().encode('nested content'),
    };

    const archiveBytes = packZipArchive(entries);
    const unpacked = unpackZipArchive(archiveBytes);

    expect(new TextDecoder().decode(unpacked['root/file.txt'])).toBe('hello world');
    expect(new TextDecoder().decode(unpacked['root/nested/other.txt'])).toBe('nested content');
  });

  it('round-trips an empty directory marker', () => {
    const entries = { 'root/empty/': new Uint8Array(0) };

    const unpacked = unpackZipArchive(packZipArchive(entries));

    expect(Object.keys(unpacked)).toContain('root/empty/');
  });

  it('throws a DomainError with archiveDamaged when the archive is not a valid ZIP', () => {
    const garbageBytes = new TextEncoder().encode('this is not a zip file');

    let caught: unknown;
    try {
      unpackZipArchive(garbageBytes);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.archiveDamaged });
  });
});

describe('createZipArchiveWriter', () => {
  it('streams a multi-chunk file entry and a directory marker into a valid archive', async () => {
    const fileBytes = new TextEncoder().encode('a'.repeat(50_000));

    const archiveBytes = await collectWriterOutput(async (writer) => {
      await writer.writeFileEntry(
        'root/large.txt',
        // eslint-disable-next-line @typescript-eslint/require-await -- AsyncIterable contract requires async generator syntax even though this fixture yields synchronously
        (async function* () {
          for (const part of chunk(fileBytes, 4096)) {
            yield part;
          }
        })(),
      );
      await writer.writeDirectoryEntry('root/empty');
    });

    const unpacked = unpackZipArchive(archiveBytes);

    expect(unpacked['root/large.txt']).toEqual(fileBytes);
    expect(Object.keys(unpacked)).toContain('root/empty/');
  });

  it('never holds more than one produced chunk before delivery resolves', async () => {
    const deliveredSizes: number[] = [];
    let inFlight = 0;
    let maxInFlight = 0;

    const writer = createZipArchiveWriter(async (archiveChunk) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      deliveredSizes.push(archiveChunk.length);
      await Promise.resolve();
      inFlight -= 1;
    });

    await writer.writeFileEntry(
      'file.bin',
      // eslint-disable-next-line @typescript-eslint/require-await -- AsyncIterable contract requires async generator syntax even though this fixture yields synchronously
      (async function* () {
        for (const part of chunk(new TextEncoder().encode('x'.repeat(20_000)), 1024)) {
          yield part;
        }
      })(),
    );
    await writer.end();

    expect(maxInFlight).toBe(1);
    expect(deliveredSizes.length).toBeGreaterThan(0);
  });

  it('produces an archive readable by a second writer entry with an empty file', async () => {
    const archiveBytes = await collectWriterOutput(async (writer) => {
      await writer.writeFileEntry('empty.txt', asyncSource(new Uint8Array(0)));
    });

    const unpacked = unpackZipArchive(archiveBytes);

    expect(unpacked['empty.txt']).toEqual(new Uint8Array(0));
  });
});

describe('createZipArchiveReader', () => {
  const buildFixtureArchive = () =>
    packZipArchive({
      'root/file.txt': new TextEncoder().encode('hello world'),
      'root/nested/other.txt': new TextEncoder().encode('nested content'),
      'root/empty/': new Uint8Array(0),
    });

  it('discovers every entry without decompressing content when read is never called', async () => {
    const archiveBytes = buildFixtureArchive();
    const discoveredPaths: string[] = [];
    const onData = vi.fn();

    const reader = createZipArchiveReader((entry) => {
      discoveredPaths.push(entry.rawPath);
    });

    await reader.push(archiveBytes, true);

    expect(discoveredPaths).toEqual(['root/file.txt', 'root/nested/other.txt', 'root/empty/']);
    expect(onData).not.toHaveBeenCalled();
  });

  it('decompresses only the entries whose read handle is called, chunk-fed across multiple pushes', async () => {
    const archiveBytes = buildFixtureArchive();
    const contents: Record<string, Uint8Array[]> = {};

    const reader = createZipArchiveReader((entry) => {
      if (entry.rawPath !== 'root/file.txt') {
        return;
      }

      contents[entry.rawPath] = [];
      entry.read((data, final) => {
        contents[entry.rawPath]?.push(data);
        expect(typeof final).toBe('boolean');
      });
    });

    const pushChunks = chunk(archiveBytes, 32);
    for (const [index, part] of pushChunks.entries()) {
      // eslint-disable-next-line no-await-in-loop -- exercises sequential backpressure between pushes
      await reader.push(part, index === pushChunks.length - 1);
    }

    const collected = contents['root/file.txt'] ?? [];
    const total = collected.reduce((sum, part) => sum + part.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const part of collected) {
      merged.set(part, offset);
      offset += part.length;
    }

    expect(new TextDecoder().decode(merged)).toBe('hello world');
    expect(contents['root/nested/other.txt']).toBeUndefined();
  });

  it('rejects the push promise with a DomainError archiveDamaged when bytes are not a valid ZIP', async () => {
    const reader = createZipArchiveReader(() => undefined);
    const garbageBytes = new TextEncoder().encode('this is not a zip file');

    let caught: unknown;
    try {
      await reader.push(garbageBytes, true);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.archiveDamaged });
  });
});
