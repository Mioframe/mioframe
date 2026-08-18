/**
 * The current Material 3 Expressive Extended FAB size variants.
 *
 * The baseline Extended FAB is no longer recommended; use the small variant.
 */
export type MDExtendedFloatingActionButtonSize = 'small' | 'medium' | 'large';

/**
 * The current Material 3 Extended FAB color mappings.
 *
 * Surface mappings are baseline-only and are not part of the current Expressive
 * contract.
 */
export type MDExtendedFloatingActionButtonColor =
  | 'primary-container'
  | 'secondary-container'
  | 'tertiary-container'
  | 'primary'
  | 'secondary'
  | 'tertiary';

/**
 * Public Extended FAB configuration.
 */
export interface MDExtendedFloatingActionButtonProps {
  /** Visual emphasis size. Defaults to `'small'`. */
  size?: MDExtendedFloatingActionButtonSize;

  /** Color mapping for the container and its on-color content. Defaults to `'primary-container'`. */
  color?: MDExtendedFloatingActionButtonColor;
}

/**
 * Material content roles for an Extended FAB.
 */
export interface MDExtendedFloatingActionButtonSlots {
  /**
   * Required visible text label describing the action.
   */
  default(): unknown;

  /**
   * Optional icon that represents the same action as the label.
   */
  icon?(): unknown;
}

/**
 * Public Extended FAB events.
 */
export interface MDExtendedFloatingActionButtonEmits {
  /**
   * Emitted when the Extended FAB is activated (pointer, touch, or
   * `Space`/`Enter` keyboard activation), forwarding the originating
   * native activation event unchanged.
   */
  click: [event: MouseEvent];
}

/**
 * Material 3 defaults for an Extended FAB.
 */
export const mdExtendedFloatingActionButtonDefaults = {
  color: 'primary-container',
  size: 'small',
} as const satisfies Pick<MDExtendedFloatingActionButtonProps, 'color' | 'size'>;
