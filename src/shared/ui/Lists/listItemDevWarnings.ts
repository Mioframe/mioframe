import { warn } from 'vue';

/**
 * Emits a development warning when a single-action MDListItem lacks an action
 * listener or href, which would leave the interactive element unreachable.
 * @param hasActionListener - true when an `@action` listener is bound
 * @param hasHref - true when an `href` prop is provided
 */
export const warnSingleActionMissingHandler = (hasActionListener: boolean, hasHref: boolean) => {
  if (!hasActionListener && !hasHref) {
    warn(
      'MDListItem: mode="single-action" requires either an @action listener or an href. Use mode="static" for non-interactive rows.',
    );
  }
};

/**
 * Emits a development warning when a multi-action MDListItem is missing its
 * trailing action slot or primary action handler.
 * @param hasTrailingAction - true when a `#trailingAction` slot is filled
 * @param hasActionListener - true when an `@action` listener is bound
 * @param hasHref - true when an `href` prop is provided
 */
export const warnMultiActionMissingRequirements = (
  hasTrailingAction: boolean,
  hasActionListener: boolean,
  hasHref: boolean,
) => {
  if (!hasTrailingAction || (!hasActionListener && !hasHref)) {
    warn(
      'MDListItem: mode="multi-action" requires either a real primary @action or href, plus a #trailingAction slot.',
    );
  }
};

/**
 * Emits a development warning when MDListItem is placed inside a selection list,
 * where MDListSelectionItem should be used instead.
 */
export const warnListItemInsideSelectionList = () => {
  warn(
    'MDListItem: rendered inside a selection list. Use MDListSelectionItem instead, which owns role=option and selection semantics.',
  );
};
