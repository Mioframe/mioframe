import { Unzip, UnzipInflate, Zip, ZipDeflate, ZipPassThrough, unzipSync, zipSync } from 'fflate';
import { DomainError } from '@shared/lib/error';
import { ZipArchiveErrorCode } from './zipArchiveErrorCode';

/** Flat map of archive entry paths to their raw bytes. Keys ending in `/` are directory markers. */
export type ZipArchiveEntries = Record<string, Uint8Array<ArrayBuffer>>;

/**
 * Packs a flat map of entry paths and bytes into a ZIP archive.
 *
 * Holds every entry's bytes plus the full packed archive in memory at once, so this is only
 * appropriate for small archives such as test fixtures. Storage-level export uses
 * {@link createZipArchiveWriter} instead to keep memory bounded.
 * @param entries - Archive entries keyed by their relative path (directory markers end in `/`).
 * @returns The packed ZIP archive bytes.
 */
export const packZipArchive = (entries: ZipArchiveEntries): Uint8Array<ArrayBuffer> =>
  zipSync(entries, { level: 6 });

/**
 * Unpacks a ZIP archive into a flat map of entry paths and bytes.
 *
 * Decompresses every entry into memory at once, so this is only appropriate for small archives
 * such as test fixtures or inspecting archives produced by {@link createZipArchiveWriter} in
 * tests. Storage-level import uses {@link createZipArchiveReader} instead to keep memory bounded.
 * @param archiveBytes - Raw bytes of a ZIP archive, e.g. read from a user-selected file.
 * @returns The archive's entries keyed by their raw recorded path.
 * @throws DomainError with code `ZipArchiveErrorCode.archiveDamaged` when the archive is damaged
 * or not a supported ZIP structure.
 */
export const unpackZipArchive = (archiveBytes: Uint8Array): ZipArchiveEntries => {
  try {
    return unzipSync(archiveBytes);
  } catch (error) {
    throw new DomainError('The archive is damaged or not a supported ZIP file.', {
      cause: error,
      code: ZipArchiveErrorCode.archiveDamaged,
    });
  }
};

// eslint-disable-next-line jsdoc/require-yields -- project TSDoc config doesn't support @yields
/**
 * Reads a `Blob`/`File` as a sequence of chunks, so a single large source never needs to be held
 * in memory as one contiguous buffer while it is streamed into or out of an archive. Yields
 * successive chunks of the blob's bytes, in order.
 * @param blob - Source blob to read, e.g. a VFS-read `File` or a user-selected archive `File`.
 */
export async function* streamBlobChunks(blob: Blob): AsyncGenerator<Uint8Array> {
  const reader = blob.stream().getReader();

  try {
    for (;;) {
      // eslint-disable-next-line no-await-in-loop -- sequential stream reads are the reader contract
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/** Callback invoked with one chunk of packed archive bytes as it becomes available. */
export type OnZipArchiveChunk = (chunk: Uint8Array, final: boolean) => void | Promise<void>;

/** Bounded-memory ZIP archive producer that streams packed bytes as entries are written. */
export type ZipArchiveWriter = {
  /**
   * Streams one file entry into the archive from a source of pre-compression chunks. Awaits
   * chunk delivery between reads so at most one source chunk stays in memory at a time.
   * @param path - Entry path recorded in the archive.
   * @param source - Async source of the entry's raw (pre-compression) bytes, e.g. a `File` stream.
   */
  writeFileEntry(path: string, source: AsyncIterable<Uint8Array>): Promise<void>;
  /**
   * Adds an empty directory marker entry.
   * @param path - Directory path recorded in the archive, without a trailing slash.
   */
  writeDirectoryEntry(path: string): Promise<void>;
  /** Finalizes the archive. No further entries may be written after this resolves. */
  end(): Promise<void>;
};

/**
 * Creates a streaming ZIP archive writer that delivers packed bytes through `onChunk` as they
 * become available, instead of accumulating the full archive in memory.
 * @param onChunk - Invoked with each packed chunk; awaited before more source data is read, so it
 * also provides backpressure.
 * @returns A writer that streams file and directory entries into one ZIP archive.
 */
export const createZipArchiveWriter = (onChunk: OnZipArchiveChunk): ZipArchiveWriter => {
  let delivery: Promise<void> = Promise.resolve();

  const zip = new Zip((error, chunk, final) => {
    if (error) {
      delivery = delivery.then(() => Promise.reject(error));
      return;
    }

    delivery = delivery.then(() => onChunk(chunk, final));
  });

  const writeFileEntry = async (path: string, source: AsyncIterable<Uint8Array>): Promise<void> => {
    const entry = new ZipDeflate(path, { level: 6 });
    zip.add(entry);

    let buffered: Uint8Array | undefined;

    for await (const chunk of source) {
      if (buffered !== undefined) {
        entry.push(buffered);

        await delivery;
      }
      buffered = chunk;
    }

    entry.push(buffered ?? new Uint8Array(0), true);
    await delivery;
  };

  const writeDirectoryEntry = async (path: string): Promise<void> => {
    const entry = new ZipPassThrough(`${path}/`);
    zip.add(entry);
    entry.push(new Uint8Array(0), true);
    await delivery;
  };

  const end = async (): Promise<void> => {
    zip.end();
    await delivery;
  };

  return { writeFileEntry, writeDirectoryEntry, end };
};

/** One archive entry discovered while streaming a ZIP archive into {@link createZipArchiveReader}. */
export type ZipArchiveEntryHandle = {
  /** Raw recorded path exactly as stored in the archive, before path-safety normalization. */
  rawPath: string;
  /**
   * Starts streaming this entry's decompressed content through `onData`. Entries that are never
   * read stay unread — nothing is decompressed unless `read` is called.
   * @param onData - Invoked with each decompressed chunk; awaited before more archive bytes are
   * decompressed, so it also provides backpressure.
   */
  read(onData: (chunk: Uint8Array, final: boolean) => void | Promise<void>): void;
};

/** Callback invoked once per archive entry as it is discovered while parsing. */
export type OnZipArchiveEntry = (entry: ZipArchiveEntryHandle) => void;

/** Bounded-memory ZIP archive parser that discovers entries as archive bytes are pushed in. */
export type ZipArchiveReader = {
  /**
   * Pushes one chunk of raw archive bytes. The returned promise settles once every entry
   * `read` handler triggered by this chunk has finished delivering its data, so callers can
   * await it between pushes for backpressure.
   * @param chunk - Raw archive bytes.
   * @param final - Whether this is the last chunk of the archive.
   * @returns Promise that resolves once this chunk's entry data has been delivered.
   * @throws DomainError with code `ZipArchiveErrorCode.archiveDamaged` when the pushed bytes are
   * not a valid ZIP stream.
   */
  push(chunk: Uint8Array, final: boolean): Promise<void>;
};

/** First two bytes ('P', 'K') shared by every real ZIP record (local header, central directory, EOCD). */
const ZIP_SIGNATURE_PREFIX = [0x50, 0x4b];

/**
 * Creates a streaming ZIP archive reader that discovers entries as archive bytes are pushed in,
 * instead of decompressing the whole archive into memory up front. An entry's content is only
 * decompressed if its handle's `read` is called, so callers can run a metadata-only pass (never
 * calling `read`) followed by a data pass over the same bytes.
 * @param onEntry - Invoked once per archive entry as it is discovered.
 * @returns A reader that entries can be pushed into.
 */
export const createZipArchiveReader = (onEntry: OnZipArchiveEntry): ZipArchiveReader => {
  let delivery: Promise<void> = Promise.resolve();
  let signaturePrefix: number[] = [];
  let signatureValidated = false;

  const assertZipSignature = (chunkBytes: Uint8Array): void => {
    if (signatureValidated) {
      return;
    }

    signaturePrefix = [...signaturePrefix, ...chunkBytes].slice(0, ZIP_SIGNATURE_PREFIX.length);

    if (signaturePrefix.length < ZIP_SIGNATURE_PREFIX.length) {
      return;
    }

    signatureValidated = true;

    if (!ZIP_SIGNATURE_PREFIX.every((byte, index) => signaturePrefix[index] === byte)) {
      throw new DomainError('The archive is damaged or not a supported ZIP file.', {
        cause: new Error('Archive bytes do not start with a ZIP signature'),
        code: ZipArchiveErrorCode.archiveDamaged,
      });
    }
  };

  const unzip = new Unzip((file) => {
    onEntry({
      rawPath: file.name,
      read: (onData) => {
        file.ondata = (error, chunk, final) => {
          if (error) {
            delivery = delivery.then(() => Promise.reject(error));
            return;
          }

          delivery = delivery.then(() => onData(chunk, final));
        };
        file.start();
      },
    });
  });

  unzip.register(UnzipInflate);

  return {
    push: (chunk, final) => {
      assertZipSignature(chunk);

      try {
        unzip.push(chunk, final);
      } catch (error) {
        throw new DomainError('The archive is damaged or not a supported ZIP file.', {
          cause: error,
          code: ZipArchiveErrorCode.archiveDamaged,
        });
      }

      return delivery;
    },
  };
};
