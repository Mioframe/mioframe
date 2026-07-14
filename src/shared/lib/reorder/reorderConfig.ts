import {
  Accessibility,
  defaultPreset,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom';

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
 * Centralized plugin set for every `ReorderSurface`: keeps autoscroll, cursor handling,
 * original-element feedback, and selection prevention from the dnd-kit default preset, but
 * excludes the `Accessibility` plugin. This surface is pointer-only, and `Accessibility` would
 * advertise unsupported keyboard drag semantics (`aria-roledescription="draggable"`,
 * `aria-grabbed`, screen-reader drag instructions) on the primary row action.
 * @param defaults - The dnd-kit default plugin preset supplied by `DragDropProvider`.
 * @returns The default plugins with `Accessibility` removed.
 */
export const getReorderPlugins = (
  defaults: typeof defaultPreset.plugins,
): typeof defaultPreset.plugins => defaults.filter((plugin) => plugin !== Accessibility);

/** Material 3 Expressive spatial transition applied to every reordering item. */
export const REORDER_TRANSITION = {
  duration: 350,
  easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)',
  idle: false,
} as const;
