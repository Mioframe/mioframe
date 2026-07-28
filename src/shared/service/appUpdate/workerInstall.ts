import type { ManagedChannel } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import { buildReleaseCacheNames, checkReleaseAvailability } from './releaseCache';
import {
  fetchLatestReleasePointer,
  fetchReleaseDescriptor,
  prepareRelease,
} from './releasePreparation';
import { buildInitialControllerState } from './stateTransitions';

/**
 * Runs this channel's install prerequisites.
 *
 * On a genuinely first install (no persisted state), fetches and fully
 * prepares the current latest release, then persists it as `activeRelease`
 * only once preparation succeeds. On an existing managed installation,
 * leaves `activeRelease` untouched and only confirms it is available or
 * restorable. Either way, the caller must call `self.skipWaiting()` only
 * after this resolves successfully — a new controller worker must never
 * change the selected application release, and a failed first install must
 * never replace a working previous worker.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @throws When prerequisites cannot be satisfied; the caller must reject installation.
 */
export async function runInstallPrerequisites(
  channel: ManagedChannel,
  channelBasePath: string,
): Promise<void> {
  const read = await readControllerState(channel);

  if (read.status === 'invalid') {
    throw new Error('Persisted controller state is invalid; refusing to activate a new controller');
  }

  if (read.status === 'absent') {
    const latest = await fetchLatestReleasePointer(channelBasePath);
    const descriptor = await fetchReleaseDescriptor(channelBasePath, latest);
    await prepareRelease(channelBasePath, channel, descriptor);
    await writeControllerState(channel, buildInitialControllerState(latest));
    return;
  }

  const { activeRelease } = read.state;
  const { final } = buildReleaseCacheNames(channel, activeRelease.releaseId);
  const finalCache = await caches.open(final);
  const alreadyAvailable = await checkReleaseAvailability(
    finalCache,
    activeRelease,
    channelBasePath,
  );
  if (alreadyAvailable) return;

  const descriptor = await fetchReleaseDescriptor(channelBasePath, activeRelease);
  await prepareRelease(channelBasePath, channel, descriptor);
}
