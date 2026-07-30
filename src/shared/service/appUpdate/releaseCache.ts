import {
  zodReleaseDescriptor,
  type Activation,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseRef,
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
 * @param releaseId - The release's immutable identifier.
 * @returns The release's Cache Storage name.
 */
export function buildReleaseCacheName(channel: ManagedChannel, releaseId: string): string {
  return `${buildManagedCacheNamespace(channel)}-release-${releaseId}`;
}

const releaseIdFromCacheName = (namespace: string, cacheName: string): string | undefined => {
  const prefix = `${namespace}-release-`;
  return cacheName.startsWith(prefix) ? cacheName.slice(prefix.length) : undefined;
};

/**
 * Returns `true` when `descriptor` proves `expectedRelease` is fully
 * available: its `ReleaseRef` matches exactly and every listed file is
 * present. Callers only reach this once a release cache's descriptor marker
 * has already been read and parsed; an unparsable or missing marker means
 * "not available" without calling this function at all.
 * @param descriptor - The release cache's parsed descriptor marker.
 * @param expectedRelease - The release the caller expects to be available.
 * @param presentPaths - Every file path currently present in the release cache.
 * @returns Whether `expectedRelease` is completely and correctly available.
 */
export function isReleaseAvailable(
  descriptor: ReleaseDescriptor,
  expectedRelease: ReleaseRef,
  presentPaths: ReadonlySet<string>,
): boolean {
  if (
    descriptor.releaseId !== expectedRelease.releaseId ||
    descriptor.releaseSequence !== expectedRelease.releaseSequence
  ) {
    return false;
  }
  return descriptor.files.every((file) => presentPaths.has(file.path));
}

/**
 * Returns `true` when `relativePath` (a request's URL pathname, relative to
 * the channel base path) is one of `descriptor`'s own listed release files.
 *
 * Used to decide whether a same-origin, same-channel request is this
 * worker's concern at all: a request for a path that is not part of the
 * currently selected release (a manifest, PWA icon, API route, or any other
 * same-origin resource outside the release) must never be served — or
 * synthetically 404'd — from the release cache; the caller falls through to
 * an ordinary network fetch instead.
 * @param descriptor - The currently selected release's descriptor.
 * @param relativePath - The request's channel-root-relative path.
 * @returns Whether `relativePath` belongs to this release.
 */
export function isReleaseFilePath(descriptor: ReleaseDescriptor, relativePath: string): boolean {
  return descriptor.files.some((file) => file.path === relativePath);
}

/** Inputs to {@link computeProtectedReleaseIds}: every release currently owned by persisted state or in-flight preparation. */
export type ProtectedReleaseInputs = {
  /** The currently active release. */
  activeRelease: ReleaseRef;
  /**
   * The most recently discovered release, if any. Discovery persists this
   * before preparation begins, and it stays the caller's only record of a
   * release between the moment its preparation completes (leaving
   * `inFlightReleaseIds`) and the moment the caller persists it as
   * `approvedRelease`. Protecting it closes that ownership gap; a release
   * that stays `latestRelease` (not yet superseded by a newer discovery)
   * also remains available for an explicit Manual retry after a failed
   * activation.
   */
  latestRelease?: ReleaseRef | undefined;
  /** An approved-but-not-yet-activated release, if any. */
  approvedRelease?: ReleaseRef | undefined;
  /** The in-progress clean-launch activation, if any. */
  activation?: Activation | undefined;
  /** Every release id currently being prepared by the {@link PreparationCoordinator}. */
  inFlightReleaseIds?: readonly string[] | undefined;
};

/**
 * Computes every release id that cleanup must never remove: the active
 * release, the most recently discovered release, an
 * approved-but-not-yet-activated release, an in-progress activation's
 * target, and every release currently being prepared.
 * @param inputs - Every release currently owned by persisted state or in-flight preparation.
 * @returns The set of protected release ids.
 */
export function computeProtectedReleaseIds(inputs: ProtectedReleaseInputs): Set<string> {
  const protectedIds = new Set<string>([inputs.activeRelease.releaseId]);
  if (inputs.latestRelease) protectedIds.add(inputs.latestRelease.releaseId);
  if (inputs.approvedRelease) protectedIds.add(inputs.approvedRelease.releaseId);
  if (inputs.activation) protectedIds.add(inputs.activation.targetRelease.releaseId);
  for (const releaseId of inputs.inFlightReleaseIds ?? []) protectedIds.add(releaseId);
  return protectedIds;
}

/**
 * Computes which of this channel's existing Cache Storage names cleanup
 * should delete: every release cache whose release id is not in
 * `protectedReleaseIds`. Cache names outside this channel's managed
 * namespace are never touched.
 * @param existingCacheNames - Every Cache Storage name currently present (any namespace).
 * @param channel - Managed channel to clean up.
 * @param protectedReleaseIds - Release ids from {@link computeProtectedReleaseIds}.
 * @returns The subset of `existingCacheNames` safe to delete.
 */
export function computeCacheNamesToDelete(
  existingCacheNames: readonly string[],
  channel: ManagedChannel,
  protectedReleaseIds: ReadonlySet<string>,
): string[] {
  const namespace = buildManagedCacheNamespace(channel);

  return existingCacheNames.filter((name) => {
    const releaseId = releaseIdFromCacheName(namespace, name);
    return releaseId !== undefined && !protectedReleaseIds.has(releaseId);
  });
}

/**
 * Deletes every release cache this channel no longer needs: any release
 * cache not currently protected by persisted state or in-flight
 * preparation. Protected owners are the active release, the most recently
 * discovered release, an approved-but-not-yet-activated release, an
 * in-progress clean-launch activation's target, and every release currently
 * being prepared (see {@link computeProtectedReleaseIds}).
 *
 * A best-effort side effect run after a lifecycle transition that can
 * release cache ownership (commit, rollback, cancellation, a mode change
 * that clears an approval, an Automatic approved-target replacement, or
 * controller activation) — never awaited as part of that transition's own
 * response, so a cleanup failure can never make an already-persisted
 * transition appear to have failed. A no-op when persisted state is not
 * currently valid.
 * @param channel - Managed channel to clean up.
 * @param inFlightReleaseIds - Every release id currently being prepared by the {@link PreparationCoordinator}, so a concurrent cleanup never deletes a cache still being populated.
 */
export async function runReleaseCacheCleanup(
  channel: ManagedChannel,
  inFlightReleaseIds: readonly string[] = [],
): Promise<void> {
  const read = await readControllerState(channel);
  if (read.status !== 'valid') return;

  const protectedReleaseIds = computeProtectedReleaseIds({
    activeRelease: read.state.activeRelease,
    latestRelease: read.state.latestRelease,
    approvedRelease: read.state.approvedRelease,
    activation: read.state.activation,
    inFlightReleaseIds,
  });
  const existingCacheNames = await caches.keys();
  const staleCacheNames = computeCacheNamesToDelete(
    existingCacheNames,
    channel,
    protectedReleaseIds,
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
 * Reads a release cache's commit marker and confirms `expectedRelease` is
 * completely available in it (see {@link isReleaseAvailable}): the
 * descriptor marker parses and matches, the archived index marker is
 * present, and every listed file is present. No response may be served from
 * a release cache before this check succeeds.
 *
 * Independently re-checks the index marker rather than relying only on
 * preparation's write ordering, since Cache Storage entries may be evicted
 * individually under storage pressure — the descriptor marker surviving
 * does not guarantee every other entry did too.
 * @param cache - The release's Cache Storage cache.
 * @param expectedRelease - The release the caller expects to be available.
 * @param channelBasePath - This worker's channel base path, used to recover each cached request's relative file path.
 * @returns Whether `expectedRelease` is completely and correctly available in `cache`.
 */
export async function checkReleaseAvailability(
  cache: Pick<Cache, 'match' | 'keys'>,
  expectedRelease: ReleaseRef,
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
  return isReleaseAvailable(descriptor, expectedRelease, presentPaths);
}
