import type { MaybeElementRef } from '@vueuse/core';
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
  /** Scrollable ancestor driven by edge auto-scroll; defaults to the surface container. */
  scrollContainer?: MaybeElementRef;
  /** Persistence callback invoked after a successful local reorder. */
  onCommit: (payload: ReorderCommitPayload) => unknown;
}

/** Payload emitted when the reorder engine starts a session. */
export interface ReorderEngineStartPayload {
  /** Id of the lifted item. */
  itemId: string;
  /** Ordered ids read from the DOM at session start. */
  orderedIds: string[];
  /** Index of the lifted item at session start. */
  fromIndex: number;
  /** Input source that activated the session. */
  input: ReorderInput;
}

/** Payload emitted when the reorder engine ends a session. */
export interface ReorderEngineEndPayload {
  /** Ordered ids after the session; equals the start order on cancel. */
  orderedIds: string[];
  /** Index of the lifted item at session start. */
  fromIndex: number;
  /** Index the lifted item landed on; equals `fromIndex` on cancel. */
  toIndex: number;
}

/** Callbacks exposed by the geometry-based reorder engine. */
export interface ReorderEngineCallbacks {
  /** Called when a press activates into a reorder session. */
  onStart?: (payload: ReorderEngineStartPayload) => unknown;
  /** Called before `onEnd` when the session is cancelled instead of dropped. */
  onCancel?: () => unknown;
  /** Called when the session ends, after DOM cleanup and before persistence. */
  onEnd?: (payload: ReorderEngineEndPayload) => unknown;
}
