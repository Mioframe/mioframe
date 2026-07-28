import {
  zodReleaseDescriptor,
  type Activation,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseRef,
} from './contracts';

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

/** The staging and final Cache Storage names for one release. */
export type ReleaseCacheNames = {
  /** Transient cache used only while downloading and validating a release's files. */
  staging: string;
  /** Cache a release is served from once fully validated and committed. */
  final: string;
};

/**
 * Builds the staging and final Cache Storage names for one release.
 * @param channel - Managed channel.
 * @param releaseId - The release's immutable identifier.
 * @returns The release's `{ staging, final }` cache names.
 */
export function buildReleaseCacheNames(
  channel: ManagedChannel,
  releaseId: string,
): ReleaseCacheNames {
  const namespace = buildManagedCacheNamespace(channel);
  return {
    staging: `${namespace}-release-staging-${releaseId}`,
    final: `${namespace}-release-final-${releaseId}`,
  };
}

const releaseIdFromFinalCacheName = (namespace: string, cacheName: string): string | undefined => {
  const prefix = `${namespace}-release-final-`;
  return cacheName.startsWith(prefix) ? cacheName.slice(prefix.length) : undefined;
};

/**
 * Returns `true` when `descriptor` proves `expectedRelease` is fully
 * available: its `ReleaseRef` matches exactly and every listed file is
 * present. Callers only reach this once a final cache's descriptor marker
 * has already been read and parsed; an unparsable or missing marker means
 * "not available" without calling this function at all.
 * @param descriptor - The final cache's parsed descriptor marker.
 * @param expectedRelease - The release the caller expects to be available.
 * @param presentPaths - Every file path currently present in the final cache.
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

/** Inputs to {@link computeProtectedReleaseIds}: every release currently owned by persisted state. */
export type ProtectedReleaseInputs = {
  /** The currently active release. */
  activeRelease: ReleaseRef;
  /** An approved-but-not-yet-activated release, if any. */
  approvedRelease?: ReleaseRef | undefined;
  /** The in-progress clean-launch activation, if any. */
  activation?: Activation | undefined;
  /** The latest release fully prepared for explicit Manual approval, if any. */
  manualCandidateReleaseId?: string | undefined;
};

/**
 * Computes every release id that cleanup must never remove: the active
 * release, an approved-but-not-yet-activated release, an in-progress
 * activation's target and previous release, and the latest release prepared
 * for explicit Manual approval.
 * @param inputs - Every release currently owned by persisted state.
 * @returns The set of protected release ids.
 */
export function computeProtectedReleaseIds(inputs: ProtectedReleaseInputs): Set<string> {
  const protectedIds = new Set<string>([inputs.activeRelease.releaseId]);
  if (inputs.approvedRelease) protectedIds.add(inputs.approvedRelease.releaseId);
  if (inputs.activation) {
    protectedIds.add(inputs.activation.targetRelease.releaseId);
    protectedIds.add(inputs.activation.previousRelease.releaseId);
  }
  if (inputs.manualCandidateReleaseId) protectedIds.add(inputs.manualCandidateReleaseId);
  return protectedIds;
}

/**
 * Computes which of this channel's existing Cache Storage names cleanup
 * should delete: every staging cache (always transient — cleanup only runs
 * serialized with preparation, so a leftover staging cache is always from an
 * interrupted prior attempt) and every final cache whose release id is not
 * in `protectedReleaseIds`. Cache names outside this channel's managed
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
  const stagingPrefix = `${namespace}-release-staging-`;

  return existingCacheNames.filter((name) => {
    if (name.startsWith(stagingPrefix)) return true;
    const releaseId = releaseIdFromFinalCacheName(namespace, name);
    return releaseId !== undefined && !protectedReleaseIds.has(releaseId);
  });
}

/** Synthetic request URL the release descriptor commit marker is stored under within a final cache. */
export const RELEASE_DESCRIPTOR_MARKER_URL =
  'https://mioframe.internal/__release-descriptor-marker__';

/** Synthetic request URL the release's archived index document is stored under within a final cache. */
export const RELEASE_INDEX_HTML_URL = 'https://mioframe.internal/__release-index-html__';

/**
 * Writes the release's archived index document (the watchdog-injected
 * `index.html` served for every same-channel navigation to this release).
 * Must be written before the descriptor marker: the descriptor marker's
 * presence is what signals the release is fully available.
 * @param cache - The release's final Cache Storage cache.
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
 * @param cache - The release's final Cache Storage cache.
 * @returns The archived index response, or `undefined` when not present.
 */
export async function readReleaseIndexMarker(
  cache: Pick<Cache, 'match'>,
): Promise<Response | undefined> {
  return cache.match(RELEASE_INDEX_HTML_URL);
}

/**
 * Writes the validated release descriptor as this final cache's commit
 * marker. Must be the last write into a final cache during preparation: its
 * presence and validity is what makes a release "available".
 * @param cache - The release's final Cache Storage cache.
 * @param descriptor - The validated release descriptor to commit.
 */
export async function writeReleaseDescriptorMarker(
  cache: Pick<Cache, 'put'>,
  descriptor: ReleaseDescriptor,
): Promise<void> {
  await cache.put(RELEASE_DESCRIPTOR_MARKER_URL, new Response(JSON.stringify(descriptor)));
}

/**
 * Reads and validates a final cache's commit marker.
 * @param cache - The release's final Cache Storage cache.
 * @returns The validated descriptor, or `undefined` when no marker is present or it is invalid.
 */
export async function readReleaseDescriptorMarker(
  cache: Pick<Cache, 'match'>,
): Promise<ReleaseDescriptor | undefined> {
  const response = await cache.match(RELEASE_DESCRIPTOR_MARKER_URL);
  if (!response) return undefined;
  const parsed = zodReleaseDescriptor.safeParse(await response.json());
  return parsed.success ? parsed.data : undefined;
}

/**
 * Reads a final cache's commit marker and confirms `expectedRelease` is
 * completely available in it (see {@link isReleaseAvailable}). No response
 * may be served from a final cache before this check succeeds.
 * @param cache - The release's final Cache Storage cache.
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

  const cachedRequests = await cache.keys();
  const presentPaths = new Set(
    cachedRequests
      .map((request) => new URL(request.url).pathname)
      .filter((pathname) => pathname.startsWith(channelBasePath))
      .map((pathname) => pathname.slice(channelBasePath.length)),
  );
  return isReleaseAvailable(descriptor, expectedRelease, presentPaths);
}
