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
