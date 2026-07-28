import {
  zodLatestReleasePointer,
  zodReleaseDescriptor,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseRef,
} from './contracts';
import {
  buildReleaseCacheNames,
  writeReleaseDescriptorMarker,
  writeReleaseIndexMarker,
} from './releaseCache';

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
  return parsed.data;
}

/**
 * Downloads, validates, and commits every file in `descriptor` for one
 * release: each file is staged, verified against its declared byte size and
 * SHA-256, then copied into the final cache; the validated descriptor is
 * written as the final cache's commit marker last. Interrupted or failed
 * preparation never touches the final cache — only the discarded staging
 * cache is affected.
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
  const { staging, final } = buildReleaseCacheNames(channel, descriptor.releaseId);
  const stagingCache = await caches.open(staging);

  try {
    await Promise.all(
      descriptor.files.map(async (file) => {
        const response = await fetch(`${channelBasePath}${file.path}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Failed to download release file: ${file.path}`);

        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== file.byteSize) {
          throw new Error(`Byte size mismatch for release file: ${file.path}`);
        }
        if ((await sha256Hex(bytes)) !== file.sha256) {
          throw new Error(`SHA-256 mismatch for release file: ${file.path}`);
        }

        await stagingCache.put(
          `${channelBasePath}${file.path}`,
          new Response(bytes, { headers: response.headers }),
        );
      }),
    );

    const indexResponse = await fetch(descriptor.indexUrl, { cache: 'no-store' });
    if (!indexResponse.ok) {
      throw new Error(`Failed to download archived index: ${descriptor.indexUrl}`);
    }
    const indexHtml = await indexResponse.text();

    const finalCache = await caches.open(final);
    await Promise.all(
      descriptor.files.map(async (file) => {
        const staged = await stagingCache.match(`${channelBasePath}${file.path}`);
        if (!staged) throw new Error(`Staged release file missing before promotion: ${file.path}`);
        await finalCache.put(`${channelBasePath}${file.path}`, staged.clone());
      }),
    );
    await writeReleaseIndexMarker(finalCache, indexHtml);

    // Written last: this marker's presence and validity is what makes the
    // release "available" (see releaseCache.ts).
    await writeReleaseDescriptorMarker(finalCache, descriptor);
  } finally {
    await caches.delete(staging);
  }
}
