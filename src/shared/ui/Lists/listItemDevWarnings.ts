import { warn } from 'vue';

/**
 * Emits a development warning when a multi-action MDListItem is missing its
 * trailing action slot.
 * @param hasTrailingAction - true when a `#trailingAction` slot is filled
 */
export const warnMultiActionMissingRequirements = (hasTrailingAction: boolean) => {
  if (!hasTrailingAction) {
    warn('MDListItem: mode="multi-action" requires a #trailingAction slot.');
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
