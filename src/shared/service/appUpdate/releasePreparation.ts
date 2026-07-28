import {
  isValidDescriptorIndexUrl,
  zodLatestReleasePointer,
  zodReleaseDescriptor,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseRef,
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
 * Fetches and validates this channel's `latest.json` pointer.
 * @param channelBasePath - This worker's channel base path, e.g. `/` or `/branch/develop/`.
 * @returns The validated {@link ReleaseRef} pointer.
 * @throws When the fetch fails or the pointer is structurally invalid.
 */
export async function fetchLatestReleasePointer(channelBasePath: string): Promise<ReleaseRef> {
  const response = await fetch(`${channelBasePath}updates/latest.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch latest.json: ${response.status}`);
  const parsed = zodLatestReleasePointer.safeParse(await response.json());
  if (!parsed.success) throw new Error('latest.json is structurally invalid');
  return parsed.data;
}

/**
 * Fetches and validates the exact descriptor for `release`, and confirms its
 * identity matches exactly (a same-sequence conflicting descriptor is
 * treated as invalid metadata, not silently accepted).
 * @param channelBasePath - This worker's channel base path.
 * @param release - The expected release identity, from `latest.json` or an explicit approval.
 * @returns The validated {@link ReleaseDescriptor}.
 * @throws When the fetch fails, the descriptor is invalid, or its identity does not match `release`.
 */
export async function fetchReleaseDescriptor(
  channelBasePath: string,
  release: ReleaseRef,
): Promise<ReleaseDescriptor> {
  const response = await fetch(`${channelBasePath}updates/releases/${release.releaseId}.json`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Failed to fetch release descriptor: ${response.status}`);
  const parsed = zodReleaseDescriptor.safeParse(await response.json());
  if (!parsed.success) throw new Error('Release descriptor is structurally invalid');
  if (
    parsed.data.releaseId !== release.releaseId ||
    parsed.data.releaseSequence !== release.releaseSequence
  ) {
    throw new Error('Release descriptor identity does not match the expected release');
  }
  if (!isValidDescriptorIndexUrl(parsed.data, channelBasePath)) {
    throw new Error('Release descriptor indexUrl does not match this channel and release');
  }
  return parsed.data;
}

/**
 * Downloads, validates, and commits every file in `descriptor` into one
 * immutable release cache; the validated descriptor is written as its
 * commit marker last.
 *
 * A no-op when `descriptor`'s release is already fully committed and
 * available — safe to call repeatedly (e.g. a slower stale preparation
 * resolving after a faster one already committed the same release) without
 * re-downloading or disturbing an already-served release; an already-valid
 * committed cache is never rebuilt or deleted.
 *
 * Otherwise, since the cache is already known incomplete or absent at this
 * point, it is deleted and recreated fresh before any file is written: a
 * failed attempt (download, hash, index fetch, or write failure) deletes
 * the incomplete cache again in its `catch`, so a repeated failure never
 * leaves stale partial content behind, and an already-good cache is never
 * at risk since this path is only reached once it has already been proven
 * not good. Downloads and hashing run with bounded concurrency
 * ({@link DOWNLOAD_CONCURRENCY_LIMIT}), not an unbounded `Promise.all` over
 * every file.
 * @param channelBasePath - This worker's channel base path.
 * @param channel - Managed channel.
 * @param descriptor - The validated release descriptor to prepare.
 * @throws When any file fails to download or fails byte-size/hash validation.
 */
export async function prepareRelease(
  channelBasePath: string,
  channel: ManagedChannel,
  descriptor: ReleaseDescriptor,
): Promise<void> {
  const cacheName = buildReleaseCacheName(channel, descriptor.releaseId);
  const release = { releaseId: descriptor.releaseId, releaseSequence: descriptor.releaseSequence };

  const existingCache = await caches.open(cacheName);
  if (await checkReleaseAvailability(existingCache, release, channelBasePath)) {
    return;
  }

  await caches.delete(cacheName);
  const cache = await caches.open(cacheName);

  try {
    await mapWithConcurrency(descriptor.files, DOWNLOAD_CONCURRENCY_LIMIT, async (file) => {
      const response = await fetch(`${channelBasePath}${file.path}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to download release file: ${file.path}`);

      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== file.byteSize) {
        throw new Error(`Byte size mismatch for release file: ${file.path}`);
      }
      if ((await sha256Hex(bytes)) !== file.sha256) {
        throw new Error(`SHA-256 mismatch for release file: ${file.path}`);
      }

      await cache.put(
        `${channelBasePath}${file.path}`,
        new Response(bytes, { headers: response.headers }),
      );
    });

    const indexResponse = await fetch(descriptor.indexUrl, { cache: 'no-store' });
    if (!indexResponse.ok) {
      throw new Error(`Failed to download archived index: ${descriptor.indexUrl}`);
    }
    const indexHtml = await indexResponse.text();
    await writeReleaseIndexMarker(cache, indexHtml);

    // Written last: this marker's presence and validity is what makes the
    // release "available" (see releaseCache.ts).
    await writeReleaseDescriptorMarker(cache, descriptor);
  } catch (error) {
    await caches.delete(cacheName);
    throw error;
  }
}
