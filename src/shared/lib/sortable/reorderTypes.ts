import type { MaybeRefOrGetter } from 'vue';
import type { ReorderInput } from './reorderInput';

/** Payload emitted when the surface asks the caller to persist a new order. */
export interface ReorderCommitPayload {
  /** Full ordered id list after the completed reorder. */
  orderedIds: string[];
  /** Id of the item that was moved. */
  movedId: string;
  /** Source index at session start. */
  fromIndex: number;
  /** Destination index at session end. */
  toIndex: number;
  /** Input source that drove the session. */
  input: ReorderInput;
}

/** Public configuration for `useReorderSurface`. */
export interface UseReorderSurfaceOptions {
  /** Authoritative external order emitted by the caller. */
  itemIdList: MaybeRefOrGetter<readonly string[] | undefined>;
  /** Disables reorder interactions when truthy. */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Persistence callback invoked after a successful local reorder. */
  onCommit: (payload: ReorderCommitPayload) => unknown;
}
