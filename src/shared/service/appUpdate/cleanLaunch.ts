/// <reference lib="webworker" />

/**
 * Returns `true` when `url` belongs to this worker's own managed channel —
 * i.e. under `channelBasePath` and, for the stable channel (where
 * `channelBasePath` is `/`), not under a foreign `/branch/**` or `/pr/**`
 * deployment. Mirrors `isForeignChannelPath` in `config/plugins/pwa.ts`,
 * reimplemented here because this runs inside the browser worker bundle,
 * which cannot depend on Node-only Vite config.
 *
 * Used both to filter window client URLs and, in `sw.ts`'s top-level
 * `fetch` handler, to keep the stable worker's otherwise site-wide scope
 * (`/`) from claiming a foreign channel's own requests — including another
 * channel's controller worker fetching its own install-time resources.
 * @param url - A window client's URL, or a fetch request's URL.
 * @param channelBasePath - This worker's channel base path, e.g. `/` or `/branch/develop/`.
 * @returns Whether `url` belongs to this worker's own channel.
 */
export function isSameChannelPath(url: string, channelBasePath: string): boolean {
  const { pathname } = new URL(url);
  if (!pathname.startsWith(channelBasePath)) return false;
  if (channelBasePath !== '/') return true;
  const rest = pathname.slice(channelBasePath.length);
  return !/^(?:branch|pr)\//.test(rest);
}

/**
 * Counts how many of `clientUrls` are live same-channel window clients.
 * Branch, PR preview, other-channel, and foreign-channel windows are never
 * counted, per {@link isSameChannelPath}.
 * @param clientUrls - Every currently live window client URL (any channel), from `clients.matchAll`.
 * @param channelBasePath - This worker's channel base path.
 * @returns The count of same-channel window clients.
 */
export function countSameChannelWindowClients(
  clientUrls: readonly string[],
  channelBasePath: string,
): number {
  return clientUrls.filter((url) => isSameChannelPath(url, channelBasePath)).length;
}

/**
 * The minimal structural shape {@link isSameChannelWindowClient} actually
 * needs from a `Client`/`WindowClient` — both required, matching their real
 * declared types, so a plain object literal satisfies it directly (no
 * forbidden type assertion needed) while remaining a normal, non-weak type
 * that real `Client`/`WindowClient` values are still structurally
 * assignable to.
 */
type ChannelClientLike = Pick<Client, 'type' | 'url'>;

/**
 * Returns `true` when `source` — an `ExtendableMessageEvent.source` or a
 * `postMessage` broadcast target — is a same-channel window client.
 *
 * The private worker protocol and rollback broadcasts must only ever trust
 * or reach same-channel windows: a same-origin page from a foreign channel
 * (another branch, a PR preview, or this worker's own scope reached through
 * `getRegistrations()` rather than `controller`) must never be able to issue
 * protocol requests or receive a rollback meant for a different deployment.
 * @param source - The message event's source, or a live window client.
 * @param channelBasePath - This worker's channel base path.
 * @returns Whether `source` is a same-channel window client.
 */
export function isSameChannelWindowClient(
  source: ChannelClientLike | ServiceWorker | MessagePort | null,
  channelBasePath: string,
): boolean {
  if (!source || !('type' in source) || source.type !== 'window') return false;
  return isSameChannelPath(source.url, channelBasePath);
}
