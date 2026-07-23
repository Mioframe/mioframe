import type {
  LatestRelease,
  ReleaseControllerState,
  ReleaseDescriptor,
  ReleaseIdentity,
} from './contracts';
import { isSameReleaseIdentity, latestReleaseSchema, releaseDescriptorSchema } from './contracts';

const FINAL_PREFIX = 'stable-release-';
const STAGING_PREFIX = 'stable-release-staging-';

const finalCacheName = (releaseId: string) => `${FINAL_PREFIX}${releaseId}`;
const descriptorPath = (releaseId: string) => `/updates/releases/${releaseId}.json`;

const sha256 = async (bytes: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
};

const parseCanonicalPath = (value: string, origin: string): string => {
  const parsed = new URL(value, origin);
  if (
    parsed.origin !== origin ||
    value !== parsed.pathname ||
    parsed.search ||
    parsed.hash ||
    /(?:^|\/)\.\.?\//.test(value) ||
    /%2e|%2f|%5c/i.test(value)
  ) {
    throw new Error('Release metadata contains a non-canonical URL.');
  }
  return parsed.pathname;
};

/**
 * Validate the complete latest-pointer and descriptor relationship.
 * @param latestValue - Untrusted latest pointer.
 * @param descriptorValue - Untrusted release descriptor.
 * @param origin - Expected stable origin.
 * @returns Matching validated metadata.
 */
export const validateReleaseMetadata = (
  latestValue: unknown,
  descriptorValue: unknown,
  origin = self.location.origin,
): {
  /** Validated latest pointer. */
  latest: LatestRelease;
  /** Validated matching descriptor. */
  descriptor: ReleaseDescriptor;
} => {
  const latest = latestReleaseSchema.parse(latestValue);
  const descriptor = releaseDescriptorSchema.parse(descriptorValue);
  const canonicalDescriptor = descriptorPath(latest.release.releaseId);
  if (parseCanonicalPath(latest.descriptorUrl, origin) !== canonicalDescriptor) {
    throw new Error('Release descriptor URL is not canonical.');
  }
  for (const field of [
    'releaseId',
    'releaseSequence',
    'appVersion',
    'buildId',
    'buildDate',
  ] as const) {
    if (descriptor[field] !== latest.release[field]) {
      throw new Error(`Release metadata ${field} mismatch.`);
    }
  }
  const canonicalIndex = `/updates/releases/${latest.release.releaseId}/index.html`;
  if (parseCanonicalPath(descriptor.indexUrl, origin) !== canonicalIndex) {
    throw new Error('Release index URL is not canonical.');
  }
  const urls = descriptor.files.map((file) => parseCanonicalPath(file.url, origin));
  if (new Set(urls).size !== urls.length) throw new Error('Release file URLs must be unique.');
  if (urls.filter((url) => url === canonicalIndex).length !== 1) {
    throw new Error('Release index must be present exactly once.');
  }
  for (const url of urls) {
    if (url !== canonicalIndex && !url.startsWith('/assets/')) {
      throw new Error('Release file is outside allowed stable locations.');
    }
  }
  return { latest, descriptor };
};

const fetchNoStore = (url: string) => fetch(url, { cache: 'no-store', credentials: 'same-origin' });

/**
 * Fetch and validate descriptor metadata for a latest pointer.
 * @param latestValue - Untrusted latest pointer.
 * @returns Matching validated metadata.
 */
export const fetchValidatedReleaseMetadata = async (
  latestValue: unknown,
): Promise<{
  /** Validated latest pointer. */
  latest: LatestRelease;
  /** Validated matching descriptor. */
  descriptor: ReleaseDescriptor;
}> => {
  const latest = latestReleaseSchema.parse(latestValue);
  const response = await fetchNoStore(latest.descriptorUrl);
  if (!response.ok) throw new Error('Release descriptor request failed.');
  return validateReleaseMetadata(latest, await response.json());
};

/**
 * Check whether an immutable final cache is complete and its descriptor's complete identity
 * matches the expected release, not only its release id and sequence.
 * @param identity - Expected immutable release identity.
 * @returns Whether the final cache is completely available under the expected identity.
 */
export const isReleaseAvailable = async (identity: ReleaseIdentity): Promise<boolean> => {
  const cache = await caches.open(finalCacheName(identity.releaseId));
  const descriptorResponse = await cache.match(descriptorPath(identity.releaseId));
  if (!descriptorResponse) return false;
  const parsed = releaseDescriptorSchema.safeParse(await descriptorResponse.json());
  if (!parsed.success) return false;
  if (!isSameReleaseIdentity(parsed.data, identity)) return false;
  if (parsed.data.indexUrl !== `/updates/releases/${identity.releaseId}/index.html`) return false;
  for (const file of parsed.data.files) {
    // eslint-disable-next-line no-await-in-loop -- Sequential inspection bounds cache work and exits on the first missing file.
    if (!(await cache.match(file.url))) return false;
  }
  return true;
};

/**
 * Read a release's own descriptor from its immutable final cache, without any network access and
 * without an expected identity to validate against. Used only to recover the worker's own
 * build-embedded release identity at offline bootstrap, before any full identity is known.
 * @param releaseId - Build-embedded release id.
 * @returns The cached, schema-valid descriptor for that id, or `undefined` when not yet cached.
 */
export const readCachedReleaseDescriptor = async (
  releaseId: string,
): Promise<ReleaseDescriptor | undefined> => {
  const cache = await caches.open(finalCacheName(releaseId));
  const descriptorResponse = await cache.match(descriptorPath(releaseId));
  if (!descriptorResponse) return undefined;
  const parsed = releaseDescriptorSchema.safeParse(await descriptorResponse.json());
  return parsed.success && parsed.data.releaseId === releaseId ? parsed.data : undefined;
};

/**
 * Stage, validate, and commit an immutable release without touching valid caches.
 * @param latestValue - Validatable latest pointer.
 * @returns Completely validated descriptor after commit.
 */
export const prepareRelease = async (latestValue: unknown): Promise<ReleaseDescriptor> => {
  const { latest, descriptor } = await fetchValidatedReleaseMetadata(latestValue);
  if (await isReleaseAvailable(latest.release)) return descriptor;

  const stagingName = `${STAGING_PREFIX}${latest.release.releaseId}-${crypto.randomUUID()}`;
  const staging = await caches.open(stagingName);
  const finalName = finalCacheName(latest.release.releaseId);
  let createdFinal = false;
  try {
    for (const file of descriptor.files) {
      // eslint-disable-next-line no-await-in-loop -- Sequential download bounds memory and stops on the first invalid file.
      const response = await fetchNoStore(file.url);
      if (!response.ok) throw new Error('Required release file request failed.');
      // eslint-disable-next-line no-await-in-loop -- Each response must finish before its bounded digest is checked.
      const bytes = await response.arrayBuffer();
      // eslint-disable-next-line no-await-in-loop -- Sequential hashing keeps only one release file in memory.
      if (bytes.byteLength !== file.byteSize || (await sha256(bytes)) !== file.sha256) {
        throw new Error('Required release file validation failed.');
      }
      // eslint-disable-next-line no-await-in-loop -- Staging remains ordered and memory-bounded.
      await staging.put(file.url, new Response(bytes, { status: 200, headers: response.headers }));
    }

    if (await isReleaseAvailable(latest.release)) return descriptor;
    const committed = await caches.open(finalName);
    createdFinal = true;
    for (const file of descriptor.files) {
      // eslint-disable-next-line no-await-in-loop -- Sequential promotion preserves bounded cache work.
      const response = await staging.match(file.url);
      if (!response) throw new Error('Staged release file disappeared.');
      // eslint-disable-next-line no-await-in-loop -- The readiness marker is written only after every ordered file copy.
      await committed.put(file.url, response);
    }
    await committed.put(
      descriptorPath(latest.release.releaseId),
      new Response(JSON.stringify(descriptor), { headers: { 'content-type': 'application/json' } }),
    );
    return descriptor;
  } catch (error) {
    if (createdFinal && !(await isReleaseAvailable(latest.release))) await caches.delete(finalName);
    throw error;
  } finally {
    await caches.delete(stagingName);
  }
};

/**
 * Read a selected release response without exposing cache details.
 * @param identity - Selected immutable release.
 * @param requestUrl - Stable application request path.
 * @param navigation - Whether to route to the archived index.
 * @returns Cached response when the selected release owns it.
 */
export const getReleaseResponse = async (
  identity: ReleaseIdentity,
  requestUrl: string,
  navigation: boolean,
): Promise<Response | undefined> => {
  const cache = await caches.open(finalCacheName(identity.releaseId));
  const key = navigation ? `/updates/releases/${identity.releaseId}/index.html` : requestUrl;
  return (await cache.match(key)) ?? undefined;
};

/**
 * Remove unreferenced final caches while protecting every durable lifecycle reference.
 * @param state - Current private controller state.
 * @returns Completion after safe cleanup.
 */
export const cleanupReleaseCaches = async (state: ReleaseControllerState): Promise<void> => {
  const preparationRelease =
    state.preparation.status === 'running' || state.preparation.status === 'ready'
      ? state.preparation.release
      : undefined;
  const protectedIds = new Set(
    [
      state.activeRelease,
      state.pinnedRelease,
      preparationRelease,
      state.trial?.targetRelease,
      state.trial?.previousRelease,
    ]
      .filter((release): release is ReleaseIdentity => release !== undefined)
      .map(({ releaseId }) => releaseId),
  );
  for (const name of await caches.keys()) {
    if (name.startsWith(STAGING_PREFIX)) continue;
    if (name.startsWith(FINAL_PREFIX) && !protectedIds.has(name.slice(FINAL_PREFIX.length))) {
      // eslint-disable-next-line no-await-in-loop -- Cache deletion is serialized to avoid an unbounded cleanup burst.
      await caches.delete(name);
    }
  }
};

/**
 * Delete every staging cache found at worker startup.
 *
 * A staging cache only exists while its owning `prepareRelease` call is still running in the same
 * worker lifetime and is otherwise removed in that call's `finally`; any staging cache found at
 * startup necessarily belongs to a call that never finished (the worker restarted), so it is always
 * safe to remove unconditionally rather than reasoning about which attempt it belonged to.
 * @returns Completion after every staging cache is removed.
 */
export const cleanupStaleStagingCaches = async (): Promise<void> => {
  for (const name of await caches.keys()) {
    if (name.startsWith(STAGING_PREFIX)) {
      // eslint-disable-next-line no-await-in-loop -- Cache deletion is serialized to avoid an unbounded cleanup burst.
      await caches.delete(name);
    }
  }
};
