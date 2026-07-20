import { MD_TYPESCALE } from '@shared/lib/md';

/** Official `md.comp.button` color style. */
export type ButtonColor = 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text';
/** `default` is a stateless action; `toggle` is a controlled two-state control. */
export type ButtonVariant = 'default' | 'toggle';
/** Official `md.comp.button` size. */
export type ButtonSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';

/**
 * `md.comp.button.text` publishes no `selected`/`unselected` tokens (verified against the
 * official token table), so `color="text"` has no toggle color route.
 * @param color - requested Button color
 * @param variant - requested Button variant
 * @returns whether the requested combination has no official toggle color route
 */
export const isUnsupportedTextToggle = (color: ButtonColor, variant: ButtonVariant): boolean =>
  color === 'text' && variant === 'toggle';

/**
 * Normalizes `variant` to `"default"` when the requested combination is unsupported.
 * @param color - requested Button color
 * @param variant - requested Button variant
 * @returns the applied variant
 */
export const resolveAppliedVariant = (color: ButtonColor, variant: ButtonVariant): ButtonVariant =>
  isUnsupportedTextToggle(color, variant) ? 'default' : variant;

/**
 * Resolves the effective selected state, `false` unless the applied variant is `toggle`.
 * @param color - requested Button color
 * @param variant - requested Button variant
 * @param selected - consumer-controlled selected state
 * @returns the applied selected state
 */
export const resolveAppliedSelected = (
  color: ButtonColor,
  variant: ButtonVariant,
  selected: boolean | undefined,
): boolean => resolveAppliedVariant(color, variant) === 'toggle' && !!selected;

/**
 * `md.comp.button.<size>.label-text` is a composite official token (font, weight, size,
 * line-height, tracking) with no decomposed `--md-comp-*` path, so it is rendered through the
 * shared `MD_TYPESCALE` classes instead of invented font fragments.
 * @param size - requested Button size
 * @returns the `MD_TYPESCALE` class for that size's label text
 */
export const resolveLabelTypescaleClass = (size: ButtonSize): string => {
  switch (size) {
    case 'extra-small':
    case 'small':
      return MD_TYPESCALE.label.large;
    case 'medium':
      return MD_TYPESCALE.title.medium;
    case 'large':
      return MD_TYPESCALE.headline.small;
    case 'extra-large':
      return MD_TYPESCALE.headline.large;
  }
};
