import { computed } from 'vue';
import { buildListItemHostStyle, resolveListItemLineCount } from './listItemLayout';
import { MD_LIST_ITEM_MIN_HEIGHTS } from './listItemSizing';

type MDListLeadingType = 'icon' | 'avatar' | 'media' | 'control';

interface ListItemAnatomyProps {
  leadingType?: MDListLeadingType | undefined;
  lineCount?: 1 | 2 | 3 | undefined;
  overline?: string | undefined;
  supportingText?: string | undefined;
}

interface ListItemAnatomySlots {
  leading?: (() => unknown) | undefined;
  overline?: (() => unknown) | undefined;
  supportingText?: (() => unknown) | undefined;
  trailing?: (() => unknown) | undefined;
}

/**
 * Shared anatomy computeds for Material list item components.
 *
 * Extracts slot detection, line-count resolution, height resolution, and the
 * derived CSS class/style values that are identical between `MDListItem` and
 * `MDListSelectionItem`.
 * @param props - Anatomy-relevant props from the host component.
 * @param slots - Slot map from the host component (via `defineSlots()`).
 * @param blockClass - BEM block class name used as prefix for element classes.
 * @returns Reactive anatomy computeds ready for use in the component template.
 */
export const useListItemAnatomy = (
  props: ListItemAnatomyProps,
  slots: ListItemAnatomySlots,
  blockClass: string,
) => {
  const hasLeading = computed(() => !!slots.leading);
  const hasOverline = computed(() => !!slots.overline || !!props.overline);
  const hasSupportingText = computed(() => !!slots.supportingText || !!props.supportingText);
  const hasTrailing = computed(() => !!slots.trailing);

  const resolvedLineCount = computed<1 | 2 | 3>(() =>
    resolveListItemLineCount(hasOverline.value, hasSupportingText.value, props.lineCount),
  );

  const resolvedHeight = computed(() => MD_LIST_ITEM_MIN_HEIGHTS[resolvedLineCount.value]);

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
