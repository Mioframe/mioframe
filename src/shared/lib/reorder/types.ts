/** Stable identifier for one reorderable item. */
export type ReorderItemId = string;

/**
 * A guarded reorder persistence request: the caller must prove it observed
 * `expectedOrderedIds` as the canonical order before applying `orderedIds`.
 */
export interface ReorderCommitRequest<TId extends ReorderItemId = ReorderItemId> {
  /** Canonical ordered ids observed at the start of the drag that produced this request. */
  readonly expectedOrderedIds: readonly TId[];
  /** The full next ordered id list to persist. */
  readonly orderedIds: readonly TId[];
}

/**
 * Outcome of a guarded reorder commit: `applied` when the target order was persisted,
 * `stale` when the canonical order no longer matched `expectedOrderedIds`.
 */
export type ReorderCommitResult = 'applied' | 'stale';
