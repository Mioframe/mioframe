const FOREIGN_STABLE_PATH_PREFIXES = ['/branch/', '/external/', '/pr/', '/updates/', '/storybook/'];

/**
 * Decide whether a URL belongs to the root stable application route space.
 * @param value - Absolute browser URL.
 * @param origin - Stable application origin.
 * @returns Whether the URL belongs to the stable app rather than another same-origin channel.
 */
export const isStableAppUrl = (value: string | URL, origin = self.location.origin): boolean => {
  const url = typeof value === 'string' ? new URL(value) : value;
  if (url.origin !== origin) return false;
  return !FOREIGN_STABLE_PATH_PREFIXES.some(
    (prefix) => url.pathname === prefix.slice(0, -1) || url.pathname.startsWith(prefix),
  );
};

/** Minimal stable-window client contract used by private helpers. */
export type StableWindowClient = Pick<WindowClient, 'id' | 'type' | 'url' | 'postMessage'>;

/**
 * Decide whether a browser client belongs to the root stable application.
 * @param client - Browser client facts.
 * @param origin - Stable application origin.
 * @returns Whether the client is a stable app window.
 */
export const isStableAppWindowClient = (
  client: Pick<Client, 'type' | 'url'>,
  origin = self.location.origin,
): client is WindowClient => {
  if (client.type !== 'window') return false;
  return isStableAppUrl(client.url, origin);
};

/**
 * Enumerate controlled root stable application windows only.
 * @returns Controlled stable application windows.
 */
export const getStableWindowClients = async (): Promise<WindowClient[]> =>
  (await self.clients.matchAll({ type: 'window', includeUncontrolled: false })).filter((client) =>
    isStableAppWindowClient(client),
  );
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;
