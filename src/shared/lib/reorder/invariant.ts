/**
 * Local programmer-contract invariants for the reorder library. Duplicate keys, duplicate
 * registrations, and duplicate containers are consumer bugs, not supported runtime states, so
 * they throw a plain `Error` with a stable, project-controlled message instead of degrading
 * silently (e.g. "last mounted wins") or requiring `DomainError` handling.
 */

/**
 * @param condition - The invariant that must hold.
 * @param message - A stable, project-controlled description of the violated invariant.
 */
export const reorderInvariant = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`useReorder: ${message}`);
};
