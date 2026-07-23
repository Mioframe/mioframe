/* eslint-disable jsdoc/require-jsdoc, no-await-in-loop -- Release files are intentionally fetched, validated, and committed sequentially to bound memory and stop on first failure. */
import type { ReleaseControllerState, ReleaseDescriptor, ReleaseIdentity } from './contracts';
import { releaseDescriptorSchema } from './contracts';

const cacheName = (releaseId: string) => `stable-release-${releaseId}`;

const digestResponse = async (
  response: Response,
): Promise<{ bytes: ArrayBuffer; sha256: string }> => {
  const bytes = await response.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return {
    bytes,
    sha256: [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join(''),
  };
};

const fetchNoStore = (url: string) => fetch(url, { cache: 'no-store', credentials: 'same-origin' });

export const prepareRelease = async (identity: ReleaseIdentity): Promise<ReleaseDescriptor> => {
  const descriptorResponse = await fetchNoStore(`/updates/releases/${identity.releaseId}.json`);
  if (!descriptorResponse.ok) throw new Error('Release descriptor request failed.');
  const descriptor = releaseDescriptorSchema.parse(await descriptorResponse.json());
  if (descriptor.releaseId !== identity.releaseId)
    throw new Error('Release descriptor identity mismatch.');

  const cache = await caches.open(cacheName(identity.releaseId));
  try {
    for (const file of descriptor.files) {
      const response = await fetchNoStore(file.url);
      if (!response.ok) throw new Error('Required release file request failed.');
      const { bytes, sha256 } = await digestResponse(response);
      if (bytes.byteLength !== file.byteSize || sha256 !== file.sha256) {
        throw new Error('Required release file validation failed.');
      }
      await cache.put(file.url, new Response(bytes, { headers: response.headers, status: 200 }));
    }
    await cache.put(
      `/updates/releases/${identity.releaseId}.json`,
      new Response(JSON.stringify(descriptor), { headers: { 'content-type': 'application/json' } }),
    );
    return descriptor;
  } catch (error) {
    await caches.delete(cacheName(identity.releaseId));
    throw error;
  }
};

export const isReleaseAvailable = async (identity: ReleaseIdentity): Promise<boolean> => {
  const cache = await caches.open(cacheName(identity.releaseId));
  const descriptorResponse = await cache.match(`/updates/releases/${identity.releaseId}.json`);
  if (!descriptorResponse) return false;
  const parsed = releaseDescriptorSchema.safeParse(await descriptorResponse.json());
  if (!parsed.success) return false;
  for (const file of parsed.data.files) {
    if (!(await cache.match(file.url))) return false;
  }
  return true;
};

export const getReleaseResponse = async (
  identity: ReleaseIdentity,
  requestUrl: string,
  navigation: boolean,
): Promise<Response | undefined> => {
  const cache = await caches.open(cacheName(identity.releaseId));
  const key = navigation ? `/updates/releases/${identity.releaseId}/index.html` : requestUrl;
  return (await cache.match(key)) ?? undefined;
};

export const cleanupReleaseCaches = async (state: ReleaseControllerState): Promise<void> => {
  const protectedIds = new Set(
    [
      state.activeRelease,
      state.pinnedRelease,
      state.candidateRelease,
      state.bootAttempt,
      state.previousRelease,
    ]
      .filter((identity): identity is ReleaseIdentity => identity !== undefined)
      .map(({ releaseId }) => releaseId),
  );
  for (const name of await caches.keys()) {
    if (!name.startsWith('stable-release-')) continue;
    if (!protectedIds.has(name.slice('stable-release-'.length))) await caches.delete(name);
  }
};
/* eslint-enable jsdoc/require-jsdoc, no-await-in-loop -- End bounded release-cache operations. */
