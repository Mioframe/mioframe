import { REORDER_IGNORE_ATTRIBUTE } from './constants';
import type { ReorderActivation, ReorderInteractiveStrategy } from './reorderTypes';

/**
 * Resolves the descendant selector used to block drag activation for the current strategy.
 *
 * `explicitIgnoreOnly` always resolves to the explicit `v-reorder-ignore` attribute
 * selector, regardless of any custom `interactiveSelector` the caller passed — full-row
 * native activation must not be reintroduced through a call-site selector escape hatch.
 * @param root0 - Strategy and fallback selector to resolve.
 * @returns The selector describing descendants that should block drag activation.
 */
export const resolveReorderInteractiveSelector = ({
  strategy,
  interactiveSelector,
}: {
  strategy: ReorderInteractiveStrategy;
  interactiveSelector: string;
}): string => {
  if (strategy === 'explicitIgnoreOnly') {
    return `[${REORDER_IGNORE_ATTRIBUTE}]`;
  }

  return interactiveSelector;
};

/**
 * Detects the one known misconfiguration where `fullRowNative` activation is paired with
 * the default interactive-descendant strategy. In that combination, a row's own primary
 * action (button/link) blocks drag from starting anywhere on the row, defeating the
 * purpose of full-row native activation.
 * @param root0 - Activation and interactive strategy to check.
 * @returns True when the combination is inconsistent with full-row native activation.
 */
export const isReorderFullRowNativeMisconfigured = ({
  activation,
  strategy,
}: {
  activation: ReorderActivation;
  strategy: ReorderInteractiveStrategy;
}): boolean => activation === 'fullRowNative' && strategy !== 'explicitIgnoreOnly';
