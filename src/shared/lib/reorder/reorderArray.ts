/**
 * Returns a copy of `list` with the item at `from` relocated to `to`.
 * @param list - Source ordered list.
 * @param from - Index of the item to relocate.
 * @param to - Destination index for the item.
 * @returns A new list with the item moved.
 */
export const moveItem = <T>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list];
  const [moved] = next.splice(from, 1);

  if (moved === undefined) {
    return next;
  }

  next.splice(to, 0, moved);
  return next;
};

/**
 * Compares two ordered lists for exact positional equality.
 * @param a - First ordered list.
 * @param b - Second ordered list.
 * @returns Whether both lists have the same items in the same order.
 */
export const isSameOrder = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);
