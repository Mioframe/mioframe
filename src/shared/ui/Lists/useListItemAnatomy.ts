import { computed, type Slots } from 'vue';
import type { MDListContextValue } from './listContext';
import { buildListItemHostStyle, resolveListItemLineCount } from './listItemLayout';

type MDListLeadingType = 'icon' | 'avatar' | 'media' | 'control';

interface ListItemAnatomyProps {
  leadingType?: MDListLeadingType | undefined;
  lineCount?: 1 | 2 | 3 | undefined;
  overline?: string | undefined;
  supportingText?: string | undefined;
}

interface ListItemAnatomySlots {
  leading?: Slots[string] | undefined;
  overline?: Slots[string] | undefined;
  supportingText?: Slots[string] | undefined;
  trailing?: Slots[string] | undefined;
}

/**
 * Shared anatomy computeds for Material list item components.
 *
 * Extracts slot detection, line-count resolution, height resolution, and the
 * derived CSS class/style values that are identical between `MDListItem` and
 * `MDListSelectionItem`.
 * @param props - Anatomy-relevant props from the host component.
 * @param slots - Slot map from the host component (via `useSlots()`).
 * @param listContext - Nearest list context, or `null` when outside a list.
 * @param blockClass - BEM block class name used as prefix for element classes.
 * @returns Reactive anatomy computeds ready for use in the component template.
 */
export const useListItemAnatomy = (
  props: ListItemAnatomyProps,
  slots: ListItemAnatomySlots,
  listContext: MDListContextValue | null,
  blockClass: string,
) => {
  const hasLeading = computed(() => !!slots.leading);
  const hasOverline = computed(() => !!slots.overline || !!props.overline);
  const hasSupportingText = computed(() => !!slots.supportingText || !!props.supportingText);
  const hasTrailing = computed(() => !!slots.trailing);

  const resolvedLineCount = computed<1 | 2 | 3>(() =>
    resolveListItemLineCount(hasOverline.value, hasSupportingText.value, props.lineCount),
  );

  const resolvedHeight = computed(
    () => listContext?.itemHeights.value[resolvedLineCount.value] ?? 56,
  );

  const hostStyle = computed(() => buildListItemHostStyle(resolvedHeight.value));

  const leadingClass = computed(() => `${blockClass}__leading_type_${props.leadingType ?? 'icon'}`);

  const supportingTextClass = computed(() => ({
    [`${blockClass}__supporting-text_two-line`]: resolvedLineCount.value === 2,
    [`${blockClass}__supporting-text_three-line`]: resolvedLineCount.value === 3,
  }));

  return {
    hasLeading,
    hasOverline,
    hasSupportingText,
    hasTrailing,
    resolvedLineCount,
    resolvedHeight,
    hostStyle,
    leadingClass,
    supportingTextClass,
  };
};
