import { watchEffect, warn, type ComputedRef } from 'vue';

/**
 * Warns in development when selection lists request `tag="ul"` even though the
 * rendered container must fall back to `div[role="listbox"]`.
 * @param selectionMode - Active list selection mode for the current MDList.
 * @param tag - Requested rendered tag before selection-list fallback is applied.
 */
export const useWarnSelectionListTagMismatch = (
  selectionMode: ComputedRef<'none' | 'single' | 'multiple'>,
  tag: ComputedRef<'div' | 'ul'>,
): void => {
  if (!import.meta.env.DEV) {
    return;
  }

  watchEffect(() => {
    if (selectionMode.value !== 'none' && tag.value === 'ul') {
      warn(
        'MDList: selectionMode lists render as div/listbox containers. Falling back from tag="ul" to tag="div".',
      );
    }
  });
};
