import { watchEffect, warn, type ComputedRef, type Ref } from 'vue';

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

/**
 * Warns in development when a selection list renders `role="listbox"` without an
 * accessible name. A listbox with no `aria-label`/`aria-labelledby` is invalid ARIA and
 * must not render silently.
 * @param isListbox - Whether the current container renders `role="listbox"`.
 * @param hasAccessibleName - Whether `aria-label` or `aria-labelledby` is present on the container.
 */
export const useWarnSelectionListMissingAccessibleName = (
  isListbox: Ref<boolean> | ComputedRef<boolean>,
  hasAccessibleName: Ref<boolean> | ComputedRef<boolean>,
): void => {
  if (!import.meta.env.DEV) {
    return;
  }

  watchEffect(() => {
    if (isListbox.value && !hasAccessibleName.value) {
      warn(
        'MDList: selectionMode listbox is missing an accessible name. Set aria-label or aria-labelledby.',
      );
    }
  });
};
