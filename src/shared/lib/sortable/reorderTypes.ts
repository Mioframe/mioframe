import type { MaybeElementRef } from '@vueuse/core';
import type { MaybeRefOrGetter } from 'vue';

/** Visual direction of the reorder surface. */
export type ReorderLayout = 'vertical' | 'horizontal' | 'grid';
/**
 * How drag activation should begin from user input.
 *
 * `fullRowNative` allows drag to start from anywhere on the row itself (including a
 * primary action element), gated by input: long press on touch/pen, intentional
 * movement on mouse. It requires `interactiveStrategy: 'explicitIgnoreOnly'` — pair it
 * with an interactive descendant strategy that only blocks explicit `v-reorder-ignore`
 * zones, otherwise the row's own primary action blocks activation.
 */
export type ReorderActivation = 'immediate' | 'longPress' | 'fullRowNative';
/** Density hint used to tune movement thresholds. */
export type ReorderDensity = 'comfortable' | 'dense' | 'precision';
/** Normalized input source for the current drag session. */
export type ReorderInput = 'pointer' | 'touch';
/**
 * Controls which descendants inside a reorder item block drag activation.
 *
 * `blockInteractiveDescendants` is the safe default: buttons, links, inputs,
 * contenteditable, role="button", and explicit `v-reorder-ignore` zones all block drag.
 *
 * `explicitIgnoreOnly` blocks drag only inside explicit `v-reorder-ignore` zones. The
 * row's own primary action (even when implemented as a button or link) does not block
 * drag. Required for `activation: 'fullRowNative'`.
 */
export type ReorderInteractiveStrategy = 'blockInteractiveDescendants' | 'explicitIgnoreOnly';

/** Resolved runtime gesture profile used to configure the drag engine. */
export interface ReorderInputProfile {
  /** Active input source for the current interaction. */
  input: ReorderInput;
  /** Surface layout the profile is tuned for. */
  layout: ReorderLayout;
  /** Density hint that affects thresholds and activation behavior. */
  density: ReorderDensity;
  /** Final activation mode after input-specific normalization. */
  activation: ReorderActivation;
  /** Press delay before drag may start. */
  delay: number;
  /** Minimum movement before drag is treated as intentional. */
  moveThreshold: number;
  /** Whether the synthetic click after drag should be swallowed. */
  suppressClickAfterDrag: boolean;
  /** Forces SortableJS fallback mode instead of native HTML5 DnD. */
  forceFallback: true;
  /** Mounts the fallback ghost on `document.body`. */
  fallbackOnBody: true;
  /** Reorder animation duration in milliseconds. */
  animation: number;
  /** Auto-scroll speed while dragging near an edge. */
  scrollSpeed: number;
  /** Distance from the edge that starts auto-scroll. */
  scrollSensitivity: number;
}

/** Payload emitted when the surface asks the caller to persist a new order. */
export interface ReorderCommitPayload {
  /** Full ordered id list after the completed drag. */
  orderedIds: string[];
  /** Id of the item that initiated the move. */
  movedId: string;
  /** Source index reported by the drag engine. */
  fromIndex: number;
  /** Destination index reported by the drag engine. */
  toIndex: number;
  /** Runtime input profile active for this drag session. */
  profile: ReorderInputProfile;
}

/** Public configuration for `useReorderSurface`. */
export interface UseReorderSurfaceOptions {
  /** Authoritative external order emitted by the caller. */
  itemIdList: MaybeRefOrGetter<readonly string[] | undefined>;
  /** Visual layout of the reorder surface. */
  layout?: MaybeRefOrGetter<ReorderLayout | undefined>;
  /** Requested drag activation mode. */
  activation?: MaybeRefOrGetter<ReorderActivation | undefined>;
  /** Density hint used for gesture tuning. */
  density?: MaybeRefOrGetter<ReorderDensity | undefined>;
  /** Disables drag interactions when truthy. */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Custom selector for descendants that should stay interactive. Only consulted under
   * `interactiveStrategy: 'blockInteractiveDescendants'`; ignored under
   * `'explicitIgnoreOnly'`, which always scopes to explicit `v-reorder-ignore` zones only.
   */
  interactiveSelector?: MaybeRefOrGetter<string | undefined>;
  /** Strategy for which descendants block drag activation. Defaults to `'blockInteractiveDescendants'`. */
  interactiveStrategy?: MaybeRefOrGetter<ReorderInteractiveStrategy | undefined>;
  /** Optional scroll target used by SortableJS auto-scroll. */
  scrollContainer?: MaybeElementRef;
  /** Persistence callback invoked after a successful local reorder. */
  onCommit: (payload: ReorderCommitPayload) => unknown;
}

/** Snapshot captured when a reorder session starts. */
export interface ReorderSessionStartPayload {
  /** Ordered id list at the moment drag starts. */
  orderedIds: string[];
  /** Id of the dragged item. */
  draggedId: string;
  /** Source index at drag start. */
  fromIndex: number;
  /** Runtime input profile active for the session. */
  profile: ReorderInputProfile;
}

/** Snapshot captured when a reorder session ends. */
export interface ReorderSessionEndPayload {
  /** Ordered id list reported by the drag engine at session end. */
  orderedIds: string[];
  /** Source index reported on drag end. */
  fromIndex: number;
  /** Destination index reported on drag end. */
  toIndex: number;
}

/** Generic event payload emitted by the low-level drag engine. */
export interface ReorderEngineEventPayload {
  /** Id read from the dragged DOM element, if present. */
  itemId: string | undefined;
  /** Current DOM order seen by SortableJS. */
  orderedIds: string[];
  /** Source index reported by SortableJS. */
  fromIndex: number;
  /** Destination index reported by SortableJS. */
  toIndex: number;
}

/** Callbacks exposed by the low-level drag engine adapter. */
export interface ReorderEngineCallbacks {
  /** Called when SortableJS enters an active drag session. */
  onStart?: (payload: ReorderEngineEventPayload) => unknown;
  /** Called when SortableJS previews a new intermediate order. */
  onChange?: (payload: ReorderEngineEventPayload) => unknown;
  /** Called when the adapter receives an Escape-cancel request. */
  onCancel?: () => unknown;
  /** Called when SortableJS finalizes or cancels the session. */
  onEnd?: (payload: ReorderEngineEventPayload) => unknown;
}
