import type { DatabaseViewId } from '@shared/lib/databaseDocument';

/**
 * @param a - The first ordered id sequence.
 * @param b - The second ordered id sequence.
 * @returns Whether the two sequences contain the same ids in the same order.
 */
export const sameIds = (a: readonly DatabaseViewId[], b: readonly DatabaseViewId[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/**
 * @param a - The first id sequence.
 * @param b - The second id sequence.
 * @returns Whether the sequences contain the same ids regardless of order.
 */
export const sameIdSet = (a: readonly DatabaseViewId[], b: readonly DatabaseViewId[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Mirrors the worker-side membership normalization for optimistic display and intent comparison.
 * @param requestedIds - The locally requested order.
 * @param canonicalIds - The canonical entity membership and fallback order.
 * @returns The requested ids that still exist, followed by missing canonical ids in canonical order.
 */
export const normalizeRequestedOrder = (
  requestedIds: readonly DatabaseViewId[],
  canonicalIds: readonly DatabaseViewId[],
): DatabaseViewId[] => {
  const canonicalIdSet = new Set(canonicalIds);
  const retainedRequestedIds = requestedIds.filter((id) => canonicalIdSet.has(id));
  const seenIds = new Set(retainedRequestedIds);

  return [...retainedRequestedIds, ...canonicalIds.filter((id) => !seenIds.has(id))];
};
