import {
  isPositiveSafeInteger,
  releaseSummariesMatch,
  toReleaseSummary,
  zodReleaseDescriptor,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseSummary,
  type UpdateCandidate,
} from './contracts';
import { readControllerState } from './controllerState';

/**
 * Builds this channel's Cache Storage name prefix.
 *
 * Intentionally a small, fixed two-channel mapping rather than an import of
 * `config/plugins/pwa.ts`'s general `{ channel, channelId }` build-time cache
 * namespacing: this runs inside the browser worker bundle, which cannot
 * depend on Node-only Vite config. Keep the produced names aligned with
 * `buildChannelCacheNamespace('stable')` / `buildChannelCacheNamespace('branch', 'develop')`.
 * @param channel - Managed channel.
 * @returns The channel's Cache Storage name prefix.
 */
export const buildManagedCacheNamespace = (channel: ManagedChannel): string =>
  channel === 'stable' ? 'stable' : 'branch-develop';

/**
 * Builds the one immutable Cache Storage name for a release.
 * @param channel - Managed channel.
 * @param releaseNumber - The release's identity.
 * @returns The release's Cache Storage name.
 * @throws When `releaseNumber` is not a positive safe integer — never
 * coerced, truncated, rounded, clamped, normalized, or stringified into a
 * cache name.
 */
export function buildReleaseCacheName(channel: ManagedChannel, releaseNumber: number): string {
  if (!isPositiveSafeInteger(releaseNumber)) {
    throw new Error('Refusing to build a release cache name for a non-canonical release number');
  }
  return `${buildManagedCacheNamespace(channel)}-release-${releaseNumber}`;
}

/** Matches only a canonical positive decimal integer: no leading zero, sign, decimal point, or exponent. */
const CANONICAL_RELEASE_NUMBER_PATTERN = /^[1-9]\d*$/;

const releaseNumberFromCacheName = (namespace: string, cacheName: string): number | undefined => {
  const prefix = `${namespace}-release-`;
  if (!cacheName.startsWith(prefix)) return undefined;
  const suffix = cacheName.slice(prefix.length);
  if (!CANONICAL_RELEASE_NUMBER_PATTERN.test(suffix)) return undefined;
  const numeric = Number(suffix);
  return isPositiveSafeInteger(numeric) ? numeric : undefined;
};

/**
 * Returns `true` when `descriptor` proves `expected` is fully available: its
 * complete release identity (`releaseNumber`, `appVersion`, `buildId`,
 * `buildDate` — see {@link releaseSummariesMatch}) matches exactly and every
 * listed file is present. A marker that merely shares `expected`'s release
 * number is not enough — it must be the exact same release. Callers only
 * reach this once a release cache's descriptor marker has already been read
 * and parsed; an unparsable or missing marker means "not available" without
 * calling this function at all.
 * @param descriptor - The release cache's parsed descriptor marker.
 * @param expected - The complete release summary the caller expects to be available.
 * @param presentPaths - Every file path currently present in the release cache.
 * @returns Whether `expected` is completely and correctly available.
 */
export function isReleaseAvailable(
  descriptor: ReleaseDescriptor,
  expected: ReleaseSummary,
  presentPaths: ReadonlySet<string>,
): boolean {
  if (!releaseSummariesMatch(toReleaseSummary(descriptor), expected)) return false;
  return descriptor.files.every((file) => presentPaths.has(file.path));
}

/**
 * Returns `true` when `relativePath` (a request's URL pathname, relative to
 * the channel base path) is one of `descriptor`'s own listed release files.
 *
 * Used after a request has already been classified as an owned
 * `<channelBasePath>assets/**` path. A path that is not listed by the active
 * descriptor receives a controlled `404`; it never falls through to the
 * network.
 * @param descriptor - The currently selected release's descriptor.
 * @param relativePath - The request's channel-root-relative path.
 * @returns Whether `relativePath` belongs to this release.
 */
export function isReleaseFilePath(descriptor: ReleaseDescriptor, relativePath: string): boolean {
  return descriptor.files.some((file) => file.path === relativePath);
}

/** Inputs to {@link computeProtectedReleaseNumbers}: every release currently owned by persisted state or in-flight preparation. */
export type ProtectedReleaseInputs = {
  /** The currently active release. */
  activeRelease: ReleaseSummary;
  /** The single future release candidate, if any. */
  candidate?: UpdateCandidate | undefined;
  /** Every release number currently being prepared by the {@link PreparationCoordinator}. */
  inFlightReleaseNumbers?: readonly number[] | undefined;
};

/**
 * Computes every release number that cleanup must never remove: the active
 * release, the single future candidate (if any), and every release currently
 * being prepared.
 * @param inputs - Every release currently owned by persisted state or in-flight preparation.
 * @returns The set of protected release numbers.
 */
export function computeProtectedReleaseNumbers(inputs: ProtectedReleaseInputs): Set<number> {
  const protectedNumbers = new Set<number>([inputs.activeRelease.releaseNumber]);
  if (inputs.candidate) protectedNumbers.add(inputs.candidate.release.releaseNumber);
  for (const releaseNumber of inputs.inFlightReleaseNumbers ?? []) {
    protectedNumbers.add(releaseNumber);
  }
  return protectedNumbers;
}

/**
 * Computes which of this channel's existing Cache Storage names cleanup
 * should delete: every release cache whose release number is not in
 * `protectedReleaseNumbers`. Cache names outside this channel's managed
 * namespace are never touched.
 * @param existingCacheNames - Every Cache Storage name currently present (any namespace).
 * @param channel - Managed channel to clean up.
 * @param protectedReleaseNumbers - Release numbers from {@link computeProtectedReleaseNumbers}.
 * @returns The subset of `existingCacheNames` safe to delete.
 */
export function computeCacheNamesToDelete(
  existingCacheNames: readonly string[],
  channel: ManagedChannel,
  protectedReleaseNumbers: ReadonlySet<number>,
): string[] {
  const namespace = buildManagedCacheNamespace(channel);

  return existingCacheNames.filter((name) => {
    const releaseNumber = releaseNumberFromCacheName(namespace, name);
    return releaseNumber !== undefined && !protectedReleaseNumbers.has(releaseNumber);
  });
}

/**
 * Deletes every release cache this channel no longer needs: any release
 * cache not currently protected by persisted state or in-flight preparation.
 * Protected owners are the active release, the single future candidate (if
 * any), and every release currently being prepared (see
 * {@link computeProtectedReleaseNumbers}).
 *
 * A best-effort side effect run after a lifecycle transition that can
 * release cache ownership (controller activation/startup maintenance,
 * candidate replacement by a newer release, a successful `BOOT_OK`, or
 * completion of a stale preparation) — never awaited as part of that
 * transition's own response, so a cleanup failure can never make an
 * already-persisted transition appear to have failed. A no-op when persisted
 * state is not currently valid.
 * @param channel - Managed channel to clean up.
 * @param inFlightReleaseNumbers - Every release number currently being prepared by the {@link PreparationCoordinator}, so a concurrent cleanup never deletes a cache still being populated.
 */
export async function runReleaseCacheCleanup(
  channel: ManagedChannel,
  inFlightReleaseNumbers: readonly number[] = [],
): Promise<void> {
  const read = await readControllerState(channel);
  if (read.status !== 'valid') return;

  const protectedReleaseNumbers = computeProtectedReleaseNumbers({
    activeRelease: read.state.activeRelease,
    candidate: read.state.candidate,
    inFlightReleaseNumbers,
  });
  const existingCacheNames = await caches.keys();
  const staleCacheNames = computeCacheNamesToDelete(
    existingCacheNames,
    channel,
    protectedReleaseNumbers,
  );
  await Promise.all(staleCacheNames.map((name) => caches.delete(name)));
}

/** Synthetic request URL the release descriptor commit marker is stored under within a release cache. */
export const RELEASE_DESCRIPTOR_MARKER_URL =
  'https://mioframe.internal/__release-descriptor-marker__';

/** Synthetic request URL the release's archived index document is stored under within a release cache. */
export const RELEASE_INDEX_HTML_URL = 'https://mioframe.internal/__release-index-html__';

/**
 * Writes the release's archived index document (the watchdog-injected
 * `index.html` served for every same-channel navigation to this release).
 * Must be written before the descriptor marker: the descriptor marker's
 * presence is what signals the release is fully available.
 * @param cache - The release's Cache Storage cache.
 * @param indexHtml - The archived index document's HTML body.
 */
export async function writeReleaseIndexMarker(
  cache: Pick<Cache, 'put'>,
  indexHtml: string,
): Promise<void> {
  await cache.put(
    RELEASE_INDEX_HTML_URL,
    new Response(indexHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
  );
}

/**
 * Reads the release's archived index document.
 * @param cache - The release's Cache Storage cache.
 * @returns The archived index response, or `undefined` when not present.
 */
export async function readReleaseIndexMarker(
  cache: Pick<Cache, 'match'>,
): Promise<Response | undefined> {
  return cache.match(RELEASE_INDEX_HTML_URL);
}

/**
 * Writes the validated release descriptor as this release cache's commit
 * marker. Must be the last write during preparation: its presence and
 * validity is what makes a release "available".
 * @param cache - The release's Cache Storage cache.
 * @param descriptor - The validated release descriptor to commit.
 */
export async function writeReleaseDescriptorMarker(
  cache: Pick<Cache, 'put'>,
  descriptor: ReleaseDescriptor,
): Promise<void> {
  await cache.put(RELEASE_DESCRIPTOR_MARKER_URL, new Response(JSON.stringify(descriptor)));
}

/**
 * Reads and validates a release cache's commit marker. Every failure mode —
 * no marker present, a response body that is not valid JSON (rejects
 * `response.json()`), or JSON that does not match {@link zodReleaseDescriptor}
 * — returns `undefined` rather than throwing, so a corrupted marker is
 * treated exactly like a missing one and callers fall through to the
 * existing exact-release restoration path instead of an unhandled rejection.
 * @param cache - The release's Cache Storage cache.
 * @returns The validated descriptor, or `undefined` when no marker is present or it could not be read.
 */
export async function readReleaseDescriptorMarker(
  cache: Pick<Cache, 'match'>,
): Promise<ReleaseDescriptor | undefined> {
  const response = await cache.match(RELEASE_DESCRIPTOR_MARKER_URL);
  if (!response) return undefined;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return undefined;
  }
  const parsed = zodReleaseDescriptor.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Reads a release cache's commit marker and confirms `expected` is
 * completely available in it (see {@link isReleaseAvailable}): the
 * descriptor marker parses and matches `expected`'s complete release
 * identity, the archived index marker is present, and every listed file is
 * present. A marker with the same `releaseNumber` but a different
 * `appVersion`/`buildId`/`buildDate` is treated as unavailable, exactly like
 * a missing marker. No response may be served from a release cache before
 * this check succeeds.
 *
 * Independently re-checks the index marker rather than relying only on
 * preparation's write ordering, since Cache Storage entries may be evicted
 * individually under storage pressure — the descriptor marker surviving
 * does not guarantee every other entry did too.
 * @param cache - The release's Cache Storage cache.
 * @param expected - The complete release summary the caller expects to be available.
 * @param channelBasePath - This worker's channel base path, used to recover each cached request's relative file path.
 * @returns Whether `expected` is completely and correctly available in `cache`.
 */
export async function checkReleaseAvailability(
  cache: Pick<Cache, 'match' | 'keys'>,
  expected: ReleaseSummary,
  channelBasePath: string,
): Promise<boolean> {
  const descriptor = await readReleaseDescriptorMarker(cache);
  if (!descriptor) return false;

  const indexMarker = await readReleaseIndexMarker(cache);
  if (!indexMarker) return false;

  const cachedRequests = await cache.keys();
  const presentPaths = new Set(
    cachedRequests
      .map((request) => new URL(request.url).pathname)
      .filter((pathname) => pathname.startsWith(channelBasePath))
      .map((pathname) => pathname.slice(channelBasePath.length)),
  );
  return isReleaseAvailable(descriptor, expected, presentPaths);
}

/**
 * Reads a release cache's descriptor marker and returns it only when its
 * complete release identity exactly matches `expected` (see
 * {@link releaseSummariesMatch}). Unlike {@link checkReleaseAvailability},
 * never enumerates the cache's complete key set: exact per-request serving
 * (`workerFetch.ts`'s `serveRelease`) only ever needs this one marker read
 * plus a direct `cache.match()` for the specific request, never a full-cache
 * scan on every healthy request.
 * @param cache - The release's Cache Storage cache.
 * @param expected - The complete release summary the caller expects to be available.
 * @returns The matching descriptor, or `undefined` when no marker is present or its identity does not exactly match.
 */
export async function readMatchingDescriptorMarker(
  cache: Pick<Cache, 'match'>,
  expected: ReleaseSummary,
): Promise<ReleaseDescriptor | undefined> {
  const descriptor = await readReleaseDescriptorMarker(cache);
  if (!descriptor || !releaseSummariesMatch(toReleaseSummary(descriptor), expected)) {
    return undefined;
  }
  return descriptor;
}
