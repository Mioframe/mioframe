import { createStore, get, set } from 'idb-keyval';
import {
  zodUpdateControllerState,
  type ManagedChannel,
  type UpdateControllerState,
} from './contracts';

const CONTROLLER_STATE_KEY = 'controllerState';

/**
 * Builds this channel's persisted-state IndexedDB database name.
 *
 * Intentionally a small, fixed two-channel mapping rather than an import of
 * `config/plugins/pwa.ts`'s general `{ channel, channelId }` build-time cache
 * namespacing: this runs inside the browser worker bundle, which cannot
 * depend on Node-only Vite config. Keep the produced names aligned with
 * `buildChannelCacheNamespace('stable')` / `buildChannelCacheNamespace('branch', 'develop')`.
 * @param channel - Managed channel.
 * @returns The channel's IndexedDB database name.
 */
export const buildControllerStateDbName = (channel: ManagedChannel): string =>
  channel === 'stable'
    ? 'mioframe-update-controller-stable'
    : 'mioframe-update-controller-branch-develop';

/**
 * Creates this channel's `idb-keyval` custom store for the persisted
 * controller-state record.
 * @param channel - Managed channel.
 * @returns An `idb-keyval` store scoped to this channel.
 */
export const createControllerStateStore = (channel: ManagedChannel) =>
  createStore(buildControllerStateDbName(channel), 'controllerState');

/** Result of reading the persisted controller state. */
export type ControllerStateReadResult =
  | { status: 'absent' }
  | { status: 'valid'; state: UpdateControllerState }
  | { status: 'invalid' };

/**
 * Parses a raw persisted value into a controller-state read result.
 *
 * Fails closed: an unreadable or structurally invalid record never falls
 * back to a default state (unlike `localSettings`'s default-fallback
 * behavior) because a pinned release must never be silently replaced by
 * whatever the network currently serves.
 * @param raw - The raw value read from storage.
 * @returns `'absent'` when nothing is persisted yet, `'valid'` with the
 * parsed state, or `'invalid'` when the record cannot be trusted.
 */
export function parseControllerState(raw: unknown): ControllerStateReadResult {
  if (raw === undefined) return { status: 'absent' };
  const result = zodUpdateControllerState.safeParse(raw);
  return result.success ? { status: 'valid', state: result.data } : { status: 'invalid' };
}

/**
 * Reads and validates this channel's persisted controller state.
 * @param channel - Managed channel.
 * @returns The channel's {@link ControllerStateReadResult}.
 */
export async function readControllerState(
  channel: ManagedChannel,
): Promise<ControllerStateReadResult> {
  const raw = await get(CONTROLLER_STATE_KEY, createControllerStateStore(channel));
  return parseControllerState(raw);
}

/**
 * Atomically persists this channel's complete controller state.
 *
 * Validates `state` against the canonical {@link zodUpdateControllerState}
 * schema before writing: a state that violates the persisted-state invariants
 * (e.g. `approvedRelease` and `activation` both set, or a release-identity
 * conflict) must never reach durable storage, since only the next read would
 * otherwise catch it — turning a rejected write into a later full outage for
 * this channel. Never silently normalizes or resets `state`; throws instead.
 * @param channel - Managed channel.
 * @param state - The complete state to persist.
 * @throws {Error} When `state` does not satisfy the canonical controller-state schema.
 */
export async function writeControllerState(
  channel: ManagedChannel,
  state: UpdateControllerState,
): Promise<void> {
  const result = zodUpdateControllerState.safeParse(state);
  if (!result.success) {
    throw new Error('Refusing to persist an invalid controller state');
  }
  await set(CONTROLLER_STATE_KEY, result.data, createControllerStateStore(channel));
}
