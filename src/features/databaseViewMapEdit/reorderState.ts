/**
 * Returns a copy of `list` with the item at `from` relocated to `to`.
 * @param list - Source ordered list.
 * @param from - Index of the item to relocate.
 * @param to - Destination index for the item.
 * @returns A new list with the item moved.
 */
export const arrayMove = <T>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list];
  const [moved] = next.splice(from, 1);

  if (moved === undefined) {
    return next;
  }

  next.splice(to, 0, moved);
  return next;
};

/**
 * Compares two ordered id lists for exact positional equality.
 * @param a - First ordered list.
 * @param b - Second ordered list.
 * @returns Whether both lists have the same items in the same order.
 */
export const arraysEqual = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * Resolves the order to render: the canonical order while idle, or the pending
 * optimistic order normalized against the latest canonical membership so ids
 * removed elsewhere drop out and newly added ids appear in canonical order.
 * @param pending - Optimistic order awaiting or already confirmed by canonical state, or `null`.
 * @param canonical - Authoritative ordered id list from the entity.
 * @returns The order to render.
 */
export const normalizeDisplayOrder = <T>(
  pending: readonly T[] | null,
  canonical: readonly T[],
): T[] => {
  if (!pending) {
    return [...canonical];
  }

  const canonicalSet = new Set(canonical);
  const kept = pending.filter((id) => canonicalSet.has(id));
  const keptSet = new Set(kept);
  const appended = canonical.filter((id) => !keptSet.has(id));

  return [...kept, ...appended];
};
