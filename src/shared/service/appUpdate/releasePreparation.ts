import {
  buildArchivedIndexPath,
  buildLatestPointerPath,
  buildReleaseDescriptorPath,
  toReleaseSummary,
  zodLatestReleasePointer,
  zodReleaseDescriptor,
  type LatestReleasePointer,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseSummary,
} from './contracts';
import {
  buildReleaseCacheName,
  checkReleaseAvailability,
  writeReleaseDescriptorMarker,
  writeReleaseIndexMarker,
} from './releaseCache';

/**
 * Small, fixed concurrency cap for release file downloads and hashing,
 * appropriate for low-end mobile devices. An unbounded `Promise.all` over
 * every release asset would otherwise fire potentially dozens of concurrent
 * fetches and hash computations at once.
 */
const DOWNLOAD_CONCURRENCY_LIMIT = 4;

/**
 * Runs `fn` over every item in `items`, at most `limit` calls in flight at
 * once, preserving each result's original index.
 * @param items - Items to process.
 * @param limit - Maximum concurrent calls to `fn`.
 * @param fn - Async work to run for each item.
 * @returns Results in the same order as `items`.
 */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = nextIndex++;
      if (index >= items.length) return;
      const item = items[index];
      if (item === undefined) return;
      // oxlint-disable-next-line no-await-in-loop -- intentional bounded-concurrency worker; each call must finish before this worker claims its next index.
      // eslint-disable-next-line no-await-in-loop -- intentional bounded-concurrency worker; each call must finish before this worker claims its next index.
      results[index] = await fn(item);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Computes the lowercase hex SHA-256 digest of a downloaded file's bytes,
 * using the Web Crypto API available in a service worker context.
 * @param bytes - The file's downloaded bytes.
 * @returns Lowercase hex SHA-256 digest.
 */
async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Stable internal reasons {@link ReleasePreparationError} classifies a
 * release-discovery/preparation/restoration failure into (see the managed
 * pinned application updates architecture, "Release preparation failure
 * classification"). Never exposed directly — only this `reason` is safe for
 * the worker fetch/recovery boundary to surface as a recovery diagnostic
 * `problemDetail`; this error's own `message`/`cause` may still carry raw,
 * unsanitized detail for internal logging only.
 */
export const RELEASE_PREPARATION_FAILURE_REASONS = [
  'ARCHIVE_UNAVAILABLE',
  'INVALID_ARCHIVE_METADATA',
  'INTEGRITY_FAILURE',
  'CACHE_STORAGE_UNAVAILABLE',
  'RESTORATION_FAILED',
] as const;
/** One of {@link RELEASE_PREPARATION_FAILURE_REASONS}. */
export type ReleasePreparationFailureReason = (typeof RELEASE_PREPARATION_FAILURE_REASONS)[number];

/**
 * Thrown by every discovery/preparation boundary in this module, classified
 * by {@link ReleasePreparationFailureReason}. `message` keeps today's
 * internal-only wording (unchanged, for existing log/test callers); only
 * `reason` is safe to surface externally.
 */
export class ReleasePreparationError extends Error {
  readonly reason: ReleasePreparationFailureReason;

  constructor(
    reason: ReleasePreparationFailureReason,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'ReleasePreparationError';
    this.reason = reason;
  }
}

/**
 * Fetches and validates this channel's `latest.json` pointer.
 * @param channelBasePath - This worker's channel base path, e.g. `/` or `/branch/develop/`.
 * @returns The validated {@link LatestReleasePointer}.
 * @throws {ReleasePreparationError} When the fetch fails or the pointer is structurally invalid.
 */
export async function fetchLatestReleasePointer(
  channelBasePath: string,
): Promise<LatestReleasePointer> {
  let response: Response;
  try {
    response = await fetch(buildLatestPointerPath(channelBasePath), { cache: 'no-store' });
  } catch (cause) {
    throw new ReleasePreparationError(
      'ARCHIVE_UNAVAILABLE',
      cause instanceof Error ? cause.message : 'Failed to fetch latest.json',
      { cause },
    );
  }
  if (!response.ok) {
    throw new ReleasePreparationError(
      'ARCHIVE_UNAVAILABLE',
      `Failed to fetch latest.json: ${response.status}`,
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new ReleasePreparationError(
      'INVALID_ARCHIVE_METADATA',
      'latest.json is structurally invalid',
      { cause },
    );
  }
  const parsed = zodLatestReleasePointer.safeParse(body);
  if (!parsed.success) {
    throw new ReleasePreparationError(
      'INVALID_ARCHIVE_METADATA',
      'latest.json is structurally invalid',
    );
  }
  return parsed.data;
}

/**
 * Fetches and validates the exact descriptor for `release`, and confirms its
 * identity matches exactly.
 * @param channelBasePath - This worker's channel base path.
 * @param release - The expected release identity, from `latest.json` or an existing candidate.
 * @returns The validated {@link ReleaseDescriptor}.
 * @throws {ReleasePreparationError} When the fetch fails, the descriptor is invalid, or its identity does not match `release`.
 */
export async function fetchReleaseDescriptor(
  channelBasePath: string,
  release: Pick<ReleaseSummary, 'releaseNumber'>,
): Promise<ReleaseDescriptor> {
  let response: Response;
  try {
    response = await fetch(buildReleaseDescriptorPath(channelBasePath, release.releaseNumber), {
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ReleasePreparationError(
      'ARCHIVE_UNAVAILABLE',
      cause instanceof Error ? cause.message : 'Failed to fetch release descriptor',
      { cause },
    );
  }
  if (!response.ok) {
    throw new ReleasePreparationError(
      'ARCHIVE_UNAVAILABLE',
      `Failed to fetch release descriptor: ${response.status}`,
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new ReleasePreparationError(
      'INVALID_ARCHIVE_METADATA',
      'Release descriptor is structurally invalid',
      { cause },
    );
  }
  const parsed = zodReleaseDescriptor.safeParse(body);
  if (!parsed.success) {
    throw new ReleasePreparationError(
      'INVALID_ARCHIVE_METADATA',
      'Release descriptor is structurally invalid',
    );
  }
  if (parsed.data.releaseNumber !== release.releaseNumber) {
    throw new ReleasePreparationError(
      'INVALID_ARCHIVE_METADATA',
      'Release descriptor identity does not match the expected release',
    );
  }
  return parsed.data;
}

/**
 * Downloads, validates, and commits every file in `descriptor`, plus its
 * archived index (byte-size and SHA-256 verified against
 * `descriptor.indexByteSize`/`descriptor.indexSha256`), into one immutable
 * release cache; the validated descriptor is written as its commit marker
 * last, only after the index and every ordinary asset are valid.
 *
 * A no-op when `descriptor`'s release is already fully committed and
 * available — safe to call repeatedly (e.g. a slower stale preparation
 * resolving after a faster one already committed the same release) without
 * re-downloading or disturbing an already-served release; an already-valid
 * committed cache is never rebuilt or deleted.
 *
 * Otherwise, since the cache is already known incomplete or absent at this
 * point, it is deleted and recreated fresh before any file is written: a
 * failed attempt (download, hash, index fetch, or write failure) deletes the
 * incomplete cache again in its `catch`, so a repeated failure never leaves
 * stale partial content behind, and an already-good cache is never at risk
 * since this path is only reached once it has already been proven not good.
 * Downloads and hashing run with bounded concurrency
 * ({@link DOWNLOAD_CONCURRENCY_LIMIT}), not an unbounded `Promise.all` over
 * every file.
 * @param channelBasePath - This worker's channel base path.
 * @param channel - Managed channel.
 * @param descriptor - The validated release descriptor to prepare.
 * @throws {ReleasePreparationError} When any file fails to download, fails byte-size/hash validation, or Cache Storage is unavailable.
 */
export async function prepareRelease(
  channelBasePath: string,
  channel: ManagedChannel,
  descriptor: ReleaseDescriptor,
): Promise<void> {
  const cacheName = buildReleaseCacheName(channel, descriptor.releaseNumber);

  let existingCache: Cache;
  let alreadyAvailable: boolean;
  try {
    existingCache = await caches.open(cacheName);
    alreadyAvailable = await checkReleaseAvailability(
      existingCache,
      toReleaseSummary(descriptor),
      channelBasePath,
    );
  } catch (cause) {
    throw new ReleasePreparationError('CACHE_STORAGE_UNAVAILABLE', 'Cache Storage is unavailable', {
      cause,
    });
  }
  if (alreadyAvailable) return;

  let cache: Cache;
  try {
    await caches.delete(cacheName);
    cache = await caches.open(cacheName);
  } catch (cause) {
    throw new ReleasePreparationError('CACHE_STORAGE_UNAVAILABLE', 'Cache Storage is unavailable', {
      cause,
    });
  }

  try {
    await mapWithConcurrency(descriptor.files, DOWNLOAD_CONCURRENCY_LIMIT, async (file) => {
      let response: Response;
      try {
        response = await fetch(`${channelBasePath}${file.path}`, { cache: 'no-store' });
      } catch (cause) {
        throw new ReleasePreparationError(
          'ARCHIVE_UNAVAILABLE',
          cause instanceof Error ? cause.message : `Failed to download release file: ${file.path}`,
          { cause },
        );
      }
      if (!response.ok) {
        throw new ReleasePreparationError(
          'ARCHIVE_UNAVAILABLE',
          `Failed to download release file: ${file.path}`,
        );
      }

      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== file.byteSize) {
        throw new ReleasePreparationError(
          'INTEGRITY_FAILURE',
          `Byte size mismatch for release file: ${file.path}`,
        );
      }
      if ((await sha256Hex(bytes)) !== file.sha256) {
        throw new ReleasePreparationError(
          'INTEGRITY_FAILURE',
          `SHA-256 mismatch for release file: ${file.path}`,
        );
      }

      try {
        await cache.put(
          `${channelBasePath}${file.path}`,
          new Response(bytes, { headers: response.headers }),
        );
      } catch (cause) {
        throw new ReleasePreparationError(
          'CACHE_STORAGE_UNAVAILABLE',
          'Cache Storage write failed',
          {
            cause,
          },
        );
      }
    });

    const indexPath = buildArchivedIndexPath(channelBasePath, descriptor.releaseNumber);
    let indexResponse: Response;
    try {
      indexResponse = await fetch(indexPath, { cache: 'no-store' });
    } catch (cause) {
      throw new ReleasePreparationError(
        'ARCHIVE_UNAVAILABLE',
        cause instanceof Error ? cause.message : `Failed to download archived index: ${indexPath}`,
        { cause },
      );
    }
    if (!indexResponse.ok) {
      throw new ReleasePreparationError(
        'ARCHIVE_UNAVAILABLE',
        `Failed to download archived index: ${indexPath}`,
      );
    }
    const indexBytes = await indexResponse.arrayBuffer();
    if (indexBytes.byteLength !== descriptor.indexByteSize) {
      throw new ReleasePreparationError(
        'INTEGRITY_FAILURE',
        `Byte size mismatch for archived index: ${indexPath}`,
      );
    }
    if ((await sha256Hex(indexBytes)) !== descriptor.indexSha256) {
      throw new ReleasePreparationError(
        'INTEGRITY_FAILURE',
        `SHA-256 mismatch for archived index: ${indexPath}`,
      );
    }
    const indexHtml = new TextDecoder().decode(indexBytes);
    try {
      await writeReleaseIndexMarker(cache, indexHtml);

      // Written last: this marker's presence and validity is what makes the
      // release "available" (see releaseCache.ts).
      await writeReleaseDescriptorMarker(cache, descriptor);
    } catch (cause) {
      throw new ReleasePreparationError('CACHE_STORAGE_UNAVAILABLE', 'Cache Storage write failed', {
        cause,
      });
    }
  } catch (error) {
    try {
      await caches.delete(cacheName);
    } catch {
      // Best-effort cleanup only; the original failure below is what matters.
    }
    throw error instanceof ReleasePreparationError
      ? error
      : new ReleasePreparationError(
          'RESTORATION_FAILED',
          error instanceof Error ? error.message : 'Release preparation failed',
          { cause: error },
        );
  }
}
