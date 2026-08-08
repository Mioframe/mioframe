import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
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
 * Stable classification codes for a release-discovery/preparation/restoration
 * failure (see the managed pinned application updates architecture, "Release
 * preparation failure classification"). Safe for the worker fetch/recovery
 * boundary to surface directly as a recovery diagnostic `problemDetail`.
 */
export enum ReleasePreparationFailureReason {
  ARCHIVE_UNAVAILABLE = 'ARCHIVE_UNAVAILABLE',
  ARCHIVE_RESPONSE_FAILURE = 'ARCHIVE_RESPONSE_FAILURE',
  INVALID_ARCHIVE_METADATA = 'INVALID_ARCHIVE_METADATA',
  CONFLICTING_RELEASE_IDENTITY = 'CONFLICTING_RELEASE_IDENTITY',
  INTEGRITY_FAILURE = 'INTEGRITY_FAILURE',
  CACHE_STORAGE_UNAVAILABLE = 'CACHE_STORAGE_UNAVAILABLE',
  RESTORATION_FAILED = 'RESTORATION_FAILED',
}

const RELEASE_PREPARATION_FAILURE_REASON_VALUES = new Set<string>(
  Object.values(ReleasePreparationFailureReason),
);

/**
 * Builds a `DomainError` for every discovery/preparation boundary in this
 * module, classified by {@link ReleasePreparationFailureReason} as `code`.
 * `message` must stay a short, project-controlled, safe string — no paths,
 * URLs, response text, or raw external/runtime error text; that detail
 * belongs only in `cause`, preserved for internal debugging.
 * @param code - Stable failure classification.
 * @param message - Safe, project-controlled message.
 * @param options - Optional raw cause preserved for debugging.
 * @returns The classified `DomainError`.
 */
export function releasePreparationError(
  code: ReleasePreparationFailureReason,
  message: string,
  options?: { cause?: unknown },
): DomainError<ReleasePreparationFailureReason> {
  return new DomainError(message, { cause: options?.cause, code });
}

/**
 * Returns `true` when `error` is a `DomainError` classified with one of
 * {@link ReleasePreparationFailureReason} — the release-preparation
 * boundary's own failures, narrowed from any other `DomainError`.
 * @param error - The raw thrown value.
 * @returns Whether `error` is a classified release-preparation error.
 */
export function isReleasePreparationError(
  error: unknown,
): error is DomainError<ReleasePreparationFailureReason> & {
  code: ReleasePreparationFailureReason;
} {
  return (
    error instanceof DomainError &&
    typeof error.code === 'string' &&
    RELEASE_PREPARATION_FAILURE_REASON_VALUES.has(error.code)
  );
}

/**
 * Reports a release discovery/preparation/restoration failure at the single
 * boundary ({@link PreparationCoordinator.prepare}) every caller — discovery,
 * install, and recovery — funnels through, so a failure is never reported
 * twice for the same underlying attempt.
 *
 * `ARCHIVE_UNAVAILABLE` is ordinary offline/network behavior (`fetch()`
 * itself rejecting) and is never reported. Every other classified reason —
 * including {@link ReleasePreparationFailureReason.ARCHIVE_RESPONSE_FAILURE}
 * (a received, non-OK HTTP response from a required managed archive
 * resource, which is not ordinary offline behavior),
 * {@link ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA},
 * {@link ReleasePreparationFailureReason.CONFLICTING_RELEASE_IDENTITY},
 * {@link ReleasePreparationFailureReason.INTEGRITY_FAILURE},
 * {@link ReleasePreparationFailureReason.CACHE_STORAGE_UNAVAILABLE}, and
 * {@link ReleasePreparationFailureReason.RESTORATION_FAILED} — indicates a
 * broken release invariant or storage failure and is reported using the real
 * `DomainError` as the captured exception. An error that escapes this
 * boundary unclassified is reported as an unexpected failure.
 * @param error - The raw value {@link PreparationCoordinator.prepare} caught.
 */
export function reportReleasePreparationFailure(error: unknown): void {
  if (isReleasePreparationError(error)) {
    if (error.code === ReleasePreparationFailureReason.ARCHIVE_UNAVAILABLE) return;
    captureDiagnosticException(error, {
      operation: 'releasePreparation',
      failureClassification: error.code,
    });
    return;
  }
  captureDiagnosticException(error, {
    operation: 'releasePreparation',
    failureClassification: 'unexpected',
  });
}

/**
 * Fetches and validates this channel's `latest.json` pointer.
 * @param channelBasePath - This worker's channel base path, e.g. `/` or `/branch/develop/`.
 * @returns The validated {@link LatestReleasePointer}.
 * @throws {DomainError} A {@link ReleasePreparationFailureReason}-classified error when the fetch fails or the pointer is structurally invalid.
 */
export async function fetchLatestReleasePointer(
  channelBasePath: string,
): Promise<LatestReleasePointer> {
  let response: Response;
  try {
    response = await fetch(buildLatestPointerPath(channelBasePath), { cache: 'no-store' });
  } catch (cause) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.ARCHIVE_UNAVAILABLE,
      'Failed to fetch latest.json',
      { cause },
    );
  }
  if (!response.ok) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.ARCHIVE_RESPONSE_FAILURE,
      'Failed to fetch latest.json',
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
      'latest.json is structurally invalid',
      { cause },
    );
  }
  const parsed = zodLatestReleasePointer.safeParse(body);
  if (!parsed.success) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
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
 * @throws {DomainError} A {@link ReleasePreparationFailureReason}-classified error when the fetch fails, the descriptor is invalid, or its identity does not match `release`.
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
    throw releasePreparationError(
      ReleasePreparationFailureReason.ARCHIVE_UNAVAILABLE,
      'Failed to fetch release descriptor',
      {
        cause,
      },
    );
  }
  if (!response.ok) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.ARCHIVE_RESPONSE_FAILURE,
      'Failed to fetch release descriptor',
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
      'Release descriptor is structurally invalid',
      { cause },
    );
  }
  const parsed = zodReleaseDescriptor.safeParse(body);
  if (!parsed.success) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
      'Release descriptor is structurally invalid',
    );
  }
  if (parsed.data.releaseNumber !== release.releaseNumber) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA,
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
 * @throws {DomainError} A {@link ReleasePreparationFailureReason}-classified error when any file fails to download, fails byte-size/hash validation, or Cache Storage is unavailable.
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
    throw releasePreparationError(
      ReleasePreparationFailureReason.CACHE_STORAGE_UNAVAILABLE,
      'Cache Storage is unavailable',
      {
        cause,
      },
    );
  }
  if (alreadyAvailable) return;

  let cache: Cache;
  try {
    await caches.delete(cacheName);
    cache = await caches.open(cacheName);
  } catch (cause) {
    throw releasePreparationError(
      ReleasePreparationFailureReason.CACHE_STORAGE_UNAVAILABLE,
      'Cache Storage is unavailable',
      {
        cause,
      },
    );
  }

  try {
    await mapWithConcurrency(descriptor.files, DOWNLOAD_CONCURRENCY_LIMIT, async (file) => {
      let response: Response;
      try {
        response = await fetch(`${channelBasePath}${file.path}`, { cache: 'no-store' });
      } catch (cause) {
        throw releasePreparationError(
          ReleasePreparationFailureReason.ARCHIVE_UNAVAILABLE,
          'Failed to download release file',
          {
            cause,
          },
        );
      }
      if (!response.ok) {
        throw releasePreparationError(
          ReleasePreparationFailureReason.ARCHIVE_RESPONSE_FAILURE,
          'Failed to download release file',
        );
      }

      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== file.byteSize) {
        throw releasePreparationError(
          ReleasePreparationFailureReason.INTEGRITY_FAILURE,
          'Byte size mismatch for release file',
        );
      }
      if ((await sha256Hex(bytes)) !== file.sha256) {
        throw releasePreparationError(
          ReleasePreparationFailureReason.INTEGRITY_FAILURE,
          'SHA-256 mismatch for release file',
        );
      }

      try {
        await cache.put(
          `${channelBasePath}${file.path}`,
          new Response(bytes, { headers: response.headers }),
        );
      } catch (cause) {
        throw releasePreparationError(
          ReleasePreparationFailureReason.CACHE_STORAGE_UNAVAILABLE,
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
      throw releasePreparationError(
        ReleasePreparationFailureReason.ARCHIVE_UNAVAILABLE,
        'Failed to download archived index',
        {
          cause,
        },
      );
    }
    if (!indexResponse.ok) {
      throw releasePreparationError(
        ReleasePreparationFailureReason.ARCHIVE_RESPONSE_FAILURE,
        'Failed to download archived index',
      );
    }
    const indexBytes = await indexResponse.arrayBuffer();
    if (indexBytes.byteLength !== descriptor.indexByteSize) {
      throw releasePreparationError(
        ReleasePreparationFailureReason.INTEGRITY_FAILURE,
        'Byte size mismatch for archived index',
      );
    }
    if ((await sha256Hex(indexBytes)) !== descriptor.indexSha256) {
      throw releasePreparationError(
        ReleasePreparationFailureReason.INTEGRITY_FAILURE,
        'SHA-256 mismatch for archived index',
      );
    }
    const indexHtml = new TextDecoder().decode(indexBytes);
    try {
      await writeReleaseIndexMarker(cache, indexHtml);

      // Written last: this marker's presence and validity is what makes the
      // release "available" (see releaseCache.ts).
      await writeReleaseDescriptorMarker(cache, descriptor);
    } catch (cause) {
      throw releasePreparationError(
        ReleasePreparationFailureReason.CACHE_STORAGE_UNAVAILABLE,
        'Cache Storage write failed',
        {
          cause,
        },
      );
    }
  } catch (error) {
    try {
      await caches.delete(cacheName);
    } catch {
      // Best-effort cleanup only; the original failure below is what matters.
    }
    throw isReleasePreparationError(error)
      ? error
      : releasePreparationError(
          ReleasePreparationFailureReason.RESTORATION_FAILED,
          'Release preparation failed',
          {
            cause: error,
          },
        );
  }
}
