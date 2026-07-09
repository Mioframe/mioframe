import { toValue, type MaybeRefOrGetter } from 'vue';
import type {
  ReorderActivation,
  ReorderDensity,
  ReorderInput,
  ReorderInputProfile,
  ReorderLayout,
} from './reorderTypes';

/** Inputs required to resolve the runtime gesture profile for a surface. */
interface GetReorderInputProfileOptions {
  /** Active input source for the current interaction. */
  input: MaybeRefOrGetter<ReorderInput>;
  /** Surface layout being configured. */
  layout: MaybeRefOrGetter<ReorderLayout>;
  /** Requested activation mode before normalization. */
  activation: MaybeRefOrGetter<ReorderActivation>;
  /** Density hint used to tune thresholds. */
  density: MaybeRefOrGetter<ReorderDensity>;
}

/** Guards browser-only heuristics for SSR and test environments. */
const isNavigatorAvailable = (): boolean => typeof navigator !== 'undefined';

/** Picks the default input mode when no active pointer type is known yet. */
export const getDefaultReorderInput = (): ReorderInput => {
  if (!isNavigatorAvailable()) {
    return 'pointer';
  }

  if (navigator.maxTouchPoints > 0) {
    return 'touch';
  }

  if (
    typeof window !== 'undefined' &&
    'matchMedia' in window &&
    window.matchMedia('(any-pointer: coarse)').matches
  ) {
    return 'touch';
  }

  return 'pointer';
};

/**
 * Normalizes browser pointer types into the library input vocabulary.
 * @param pointerType
 */
export const getReorderInputFromPointerType = (pointerType: string | undefined): ReorderInput => {
  switch (pointerType) {
    case 'touch':
      return 'touch';
    case 'pen':
      return 'touch';
    case 'mouse':
      return 'pointer';
    default:
      return getDefaultReorderInput();
  }
};

/**
 * Prevents immediate activation on touch-like inputs that need long-press behavior.
 * @param root0
 */
const resolveActivation = ({
  activation,
  input,
}: {
  activation: ReorderActivation;
  input: ReorderInput;
}): ReorderActivation => {
  if (activation === 'immediate' && input === 'touch') {
    return 'longPress';
  }

  return activation;
};

/**
 * Returns the drag movement threshold for the current density and input mode.
 * @param root0
 */
const getMoveThreshold = ({
  density,
  input,
}: {
  density: ReorderDensity;
  input: ReorderInput;
}): number => {
  const baseThreshold = input === 'touch' ? 6 : 4;

  if (density === 'dense') {
    return baseThreshold + 1;
  }

  if (density === 'precision') {
    return Math.max(2, baseThreshold - 1);
  }

  return baseThreshold;
};

/**
 * Returns the press delay used before drag activation begins.
 *
 * `longPress` and `fullRowNative` both use a press delay, but only on touch/pen input:
 * `fullRowNative` behaves like `longPress` on touch (delay gates activation so scrolling
 * still works) and like `immediate` on mouse (no delay; movement threshold gates it
 * instead, see {@link getMoveThreshold}).
 * @param root0
 */
const getDelay = ({
  activation,
  input,
}: {
  activation: ReorderActivation;
  input: ReorderInput;
}): number => {
  const isPressGatedActivation = activation === 'longPress' || activation === 'fullRowNative';

  if (!isPressGatedActivation || input !== 'touch') {
    return 0;
  }

  return 180;
};

/**
 * Resolves the full runtime gesture profile consumed by the reorder engine.
 * @param root0
 */
export const getReorderGestureProfile = ({
  input,
  layout,
  activation,
  density,
}: GetReorderInputProfileOptions): ReorderInputProfile => {
  const resolvedInput = toValue(input);
  const resolvedLayout = toValue(layout);
  const resolvedDensity = toValue(density);
  const resolvedActivation = resolveActivation({
    activation: toValue(activation),
    input: resolvedInput,
  });

  return {
    input: resolvedInput,
    layout: resolvedLayout,
    density: resolvedDensity,
    activation: resolvedActivation,
    delay: getDelay({
      activation: resolvedActivation,
      input: resolvedInput,
    }),
    moveThreshold: getMoveThreshold({
      density: resolvedDensity,
      input: resolvedInput,
    }),
    suppressClickAfterDrag: true,
    forceFallback: true,
    fallbackOnBody: true,
    animation: 150,
    scrollSpeed: resolvedInput === 'pointer' ? 14 : 10,
    scrollSensitivity: resolvedLayout === 'grid' ? 48 : resolvedInput === 'pointer' ? 36 : 52,
  };
};
