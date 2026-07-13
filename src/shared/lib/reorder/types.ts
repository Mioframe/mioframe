/** Public types for `useReorder`. */
import type { Directive, MaybeRefOrGetter, Ref } from 'vue';

/** The public reorder key type: constrained to primitives so keys stay comparable and cheap. */
export type ReorderKey = string | number;

/** Payload for {@link UseReorderOptions.onDragStart}. */
export interface ReorderDragStartEvent<Key extends ReorderKey = ReorderKey> {
  /** The key of the item that started dragging. */
  key: Key;
  /** The item's index in `keys` at activation time. */
  index: number;
}

/** Payload for {@link UseReorderOptions.onReorder}. */
export interface ReorderMoveEvent<Key extends ReorderKey = ReorderKey> {
  /** The key of the item being moved. */
  key: Key;
  /** The item's index in `keys` before this move. */
  fromIndex: number;
  /** The requested index for the item in `keys` after this move. */
  toIndex: number;
}

/** Payload for {@link UseReorderOptions.onDragEnd}. */
export interface ReorderDragEndEvent<Key extends ReorderKey = ReorderKey> {
  /** The key of the item that was dragging. */
  key: Key;
  /** The item's index in `keys` when the session activated. */
  initialIndex: number;
  /** The item's index in `keys` when the session ended. */
  finalIndex: number;
  /** Whether the session ended by cancellation rather than a normal pointer release. */
  cancelled: boolean;
}

/** Options for {@link useReorder}. */
export interface UseReorderOptions<Key extends ReorderKey = ReorderKey> {
  /**
   * Consumer-owned ordered keys: the only authoritative source of order. The library never
   * mutates them; an active drag session keeps its own internal, non-authoritative confirmation
   * snapshot to detect external mutations and decide safe rollback, but that snapshot never
   * substitutes for this option as a source of truth.
   */
  keys: MaybeRefOrGetter<readonly Key[]>;
  /**
   * Called synchronously for every live move; the consumer must update its reactive order in
   * response. Vue may commit the corresponding DOM update asynchronously.
   */
  onReorder: (event: ReorderMoveEvent<Key>) => void;
  /** Called exactly once, only after drag activation succeeds. */
  onDragStart?: (event: ReorderDragStartEvent<Key>) => void;
  /**
   * Called exactly once for every successfully activated session — whether it completed or was
   * cancelled — as long as `keys`, `onDragStart`, and `onReorder` never throw during that
   * session. If any of those consumer-owned reads/callbacks throws, the session is instead
   * aborted and cleaned up, the original exception propagates to the caller, and `onDragEnd` is
   * not called for it.
   */
  onDragEnd?: (event: ReorderDragEndEvent<Key>) => void;
  /** Long-press delay, in milliseconds, before a touch session activates. Defaults to `400`. */
  longPressDelay?: number;
}

/** Return value of {@link useReorder}. */
export interface UseReorderReturn<Key extends ReorderKey = ReorderKey> {
  /** The key of the item currently being dragged, or `null` when no session is active. */
  draggingKey: Readonly<Ref<Key | null>>;
  /** Registers the reorder container. Apply once per `useReorder` instance: `v-reorder-container`. */
  vReorderContainer: Directive<HTMLElement>;
  /** Registers a reorderable item. Apply as `v-reorder-item="item.key"` on each item's root element. */
  vReorderItem: Directive<HTMLElement, Key>;
  /** Excludes a custom interactive descendant from starting drag activation: `v-reorder-ignore`. */
  vReorderIgnore: Directive<HTMLElement>;
}
