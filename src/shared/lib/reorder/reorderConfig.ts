import {
  Accessibility,
  AutoScroller,
  defaultPreset,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { getReorderContainer } from './getReorderContainer';
import { ReorderAutoScroller } from './ReorderAutoScroller';

/**
 * Resolves pointer activation thresholds for a reorder drag: touch and pen require a long
 * press with a small movement tolerance so native scrolling stays available before activation;
 * mouse activates after a small movement distance.
 * @param event - The pointer event evaluated for activation.
 * @returns The dnd-kit activation constraints to apply for this pointer event.
 */
const getReorderActivationConstraints = (event: PointerEvent) => {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    return [new PointerActivationConstraints.Delay({ value: 400, tolerance: 8 })];
  }

  return [new PointerActivationConstraints.Distance({ value: 4 })];
};

/** Centralized pointer-only sensor configuration for every `ReorderSurface`. */
export const REORDER_SENSORS: typeof defaultPreset.sensors = [
  PointerSensor.configure({
    activationConstraints: getReorderActivationConstraints,
  }),
];

/**
 * Centralized plugin set for every `ReorderSurface`: keeps cursor handling, original-element
 * feedback, and selection prevention from the dnd-kit default preset, but excludes the
 * `Accessibility` plugin and replaces the default `AutoScroller` with `ReorderAutoScroller`. This
 * surface is pointer-only, and `Accessibility` would advertise unsupported keyboard drag
 * semantics (`aria-roledescription="draggable"`, `aria-grabbed`, screen-reader drag instructions)
 * on the primary row action. The default `AutoScroller` has no notion of the reorder container's
 * bounds, so it keeps autoscrolling an outer scrollable ancestor (e.g. a bottom sheet) even once
 * that ancestor can no longer reveal more of the container; `ReorderAutoScroller` replaces it
 * rather than running alongside it.
 * @param defaults - The dnd-kit default plugin preset supplied by `DragDropProvider`.
 * @returns The default plugins with `Accessibility` removed and `AutoScroller` replaced.
 */
export const getReorderPlugins = (
  defaults: typeof defaultPreset.plugins,
): typeof defaultPreset.plugins =>
  defaults
    .filter((plugin) => plugin !== Accessibility)
    .map((plugin) => (plugin === AutoScroller ? ReorderAutoScroller : plugin));

/** Material 3 Expressive spatial transition applied to every reordering item. */
export const REORDER_TRANSITION = {
  duration: 350,
  easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)',
  idle: false,
} as const;

/**
 * Restricts every reorder drag to the direct DOM parent of the active sortable item, i.e. the
 * list container that renders the sortable rows. Sortable item roots must be direct DOM children
 * of the container that defines their movement bounds.
 */
export const REORDER_MODIFIERS: typeof defaultPreset.modifiers = [
  RestrictToElement.configure({
    element: getReorderContainer,
  }),
];
