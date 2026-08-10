/// <reference lib="webworker" />

import { isForeignChannelPath } from './channelContract';

/**
 * Returns `true` when `url` belongs to this worker's own managed channel:
 * same origin as `channelOrigin`, under `channelBasePath`, and — for the
 * stable channel (where `channelBasePath` is `/`) — not under a foreign
 * `/branch/**` or `/pr/**` deployment, per the canonical
 * {@link isForeignChannelPath}.
 *
 * The origin check runs first: a service worker's `fetch` event fires for
 * every request a controlled page makes, including cross-origin ones (a
 * font, an API on another domain) — scope only limits which pages the
 * worker controls, not which of their requests reach its `fetch` handler —
 * so a pathname-only check could otherwise misclassify a cross-origin
 * request whose pathname happens to match this channel's shape (trivially
 * true for the stable channel, whose `channelBasePath` is `/`).
 *
 * The foreign-path check only runs for the stable channel
 * (`channelBasePath === '/'`): a branch channel's own scope (e.g.
 * `/branch/develop/`) is already narrower than any other channel's path, so
 * the browser never dispatches fetch/navigate events for foreign paths to it
 * in the first place, and a path merely nested under that narrower scope
 * (e.g. `/branch/develop/branch/x`) must still count as same-channel.
 *
 * Used both to filter window client URLs and, in `sw.ts`'s top-level
 * `fetch` handler, to keep the stable worker's otherwise site-wide scope
 * (`/`) from claiming a foreign channel's own requests — including another
 * channel's controller worker fetching its own install-time resources.
 * @param url - A window client's URL, or a fetch request's URL.
 * @param channelBasePath - This worker's channel base path, e.g. `/` or `/branch/develop/`.
 * @param channelOrigin - This worker's own origin, from `self.registration.scope`.
 * @returns Whether `url` belongs to this worker's own channel.
 */
export function isSameChannelPath(
  url: string,
  channelBasePath: string,
  channelOrigin: string,
): boolean {
  const parsed = new URL(url);
  if (parsed.origin !== channelOrigin) return false;
  if (!parsed.pathname.startsWith(channelBasePath)) return false;
  if (channelBasePath !== '/') return true;
  return !isForeignChannelPath(parsed.pathname, channelBasePath);
}

/** The minimal identity {@link countSameChannelWindowClients} needs from a live window client. */
export type WindowClientIdentity = {
  /** The client's stable id, from `Client.id`. */
  readonly id: string;
  /** The client's current URL. */
  readonly url: string;
};

/**
 * Counts how many of `clients` are live same-channel window clients, other
 * than the client(s) belonging to the navigation currently being handled.
 *
 * Deliberately excludes by client identity (`excludedClientIds`), never by
 * URL: a fresh registration leaves its first page uncontrolled (no
 * `clients.claim()`), so that page must still count and block a newer
 * release's activation even though it is not "controlled" — and a distinct
 * window that merely happens to share the current navigation's URL must
 * still be counted. Branch, PR preview, other-channel, and foreign-origin
 * windows are never counted, per {@link isSameChannelPath}.
 * @param clients - Every currently live window client (any channel, controlled or not), from `clients.matchAll`.
 * @param excludedClientIds - The current navigation's own client ids (`clientId`, `resultingClientId`), never counted.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @returns The count of other same-channel window clients.
 */
export function countSameChannelWindowClients(
  clients: readonly WindowClientIdentity[],
  excludedClientIds: ReadonlySet<string>,
  channelBasePath: string,
  channelOrigin: string,
): number {
  return clients.filter(
    (client) =>
      !excludedClientIds.has(client.id) &&
      isSameChannelPath(client.url, channelBasePath, channelOrigin),
  ).length;
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
 * @param channelOrigin - This worker's own origin.
 * @returns Whether `source` is a same-channel window client.
 */
export function isSameChannelWindowClient(
  source: ChannelClientLike | ServiceWorker | MessagePort | null,
  channelBasePath: string,
  channelOrigin: string,
): boolean {
  if (!source || !('type' in source) || source.type !== 'window') return false;
  return isSameChannelPath(source.url, channelBasePath, channelOrigin);
}
