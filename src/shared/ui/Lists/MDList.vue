<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import {
  useWarnSelectionListMissingAccessibleName,
  useWarnSelectionListTagMismatch,
} from './listDevWarnings';
import {
  provideMDListContext,
  type MDListModelValue,
  type MDListSelectionMode,
  type MDListStyle,
} from './listContext';
import { useListActionKeyboard } from './useListActionKeyboard';
import { useListSelectionKeyboard } from './useListSelectionKeyboard';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    modelValue?: MDListModelValue;
    listStyle?: MDListStyle | undefined;
    selectionMode?: MDListSelectionMode | undefined;
    tag?: 'div' | 'ul' | undefined;
  }>(),
  {
    listStyle: 'standard',
    selectionMode: 'none',
    tag: 'div',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: MDListModelValue];
}>();

defineSlots<{
  default: () => unknown;
}>();

const containerEl = useTemplateRef<HTMLElement>('containerEl');

const resolvedListStyle = computed<MDListStyle>(() => props.listStyle);

const resolvedTag = computed<'div' | 'ul'>(() =>
  props.selectionMode === 'none' ? props.tag : 'div',
);

useWarnSelectionListTagMismatch(
  computed(() => props.selectionMode),
  computed(() => props.tag),
);

const listContext = provideMDListContext(
  resolvedListStyle,
  resolvedTag,
  computed(() => props.selectionMode),
  computed(() => props.modelValue),
  (value) => {
    emit('update:modelValue', value);
  },
);

const containerRole = computed(() => {
  if (props.selectionMode !== 'none') {
    return 'listbox';
  }

  return resolvedTag.value === 'ul' ? null : 'list';
});

const selectionActive = computed(() => props.selectionMode !== 'none');

useListSelectionKeyboard(containerEl, selectionActive, listContext.selectionRegistry);

const attrs = useAttrs();
const hasAccessibleName = computed(
  () => typeof attrs['aria-label'] === 'string' || typeof attrs['aria-labelledby'] === 'string',
);

useWarnSelectionListMissingAccessibleName(
  computed(() => containerRole.value === 'listbox'),
  hasAccessibleName,
);

useListActionKeyboard(
  containerEl,
  computed(() => !selectionActive.value),
  listContext.actionRegistry,
);
</script>

<template>
  <component
    :is="resolvedTag"
    ref="containerEl"
    v-bind="$attrs"
    class="md-list"
    :class="[`md-list_style_${resolvedListStyle}`, `md-list_selection-mode_${selectionMode}`]"
    :role="containerRole"
    :aria-multiselectable="selectionMode === 'multiple' ? 'true' : undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
.md-list {
  --md-private-list-item-container-color: transparent;
  --md-private-list-item-action-shape: 4dp;
  --md-private-list-item-container-shape: 4dp;
  --md-private-list-item-leading-size: 20dp;
  --md-private-list-item-passive-trailing-min-size: 28dp;
  --md-private-list-item-trailing-action-padding-inline-start: 8dp;
  --md-private-list-item-trailing-action-min-target-size: 48dp;
  --md-private-list-item-trailing-action-reserved: calc(
    var(--md-private-list-item-trailing-action-padding-inline-start) +
      var(--md-private-list-item-trailing-action-min-target-size)
  );

  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  list-style: none;
  background: transparent;
  color: var(--md-current-content-color, inherit);

  &_style_segmented {
    /* Items own their corner shapes via action-surface border-radius. overflow: clip
       is used for visual containment only — it does not create a scroll container,
       so the explicit min-width: 0 is required to suppress the automatic grid/flex-item
       minimum size that would otherwise allow nowrap text to expand the container. */
    --md-comp-list-segmented-gap: 2dp;
    /* M3 Expressive segmented lists use filled items separated by gaps. The list
       container has no background; visual grouping comes from the item fill and the
       gaps that reveal the parent surface beneath. Item fill uses the documented
       segmented container color token. The private token cascades to item children,
       which derive --md-comp-list-list-item-container-color from it so that item-level
       overrides (selected, dragged) can still win via the public token. */
    --md-private-list-item-container-color: var(
      --md-comp-list-list-item-segmented-container-color,
      var(--md-sys-color-surface)
    );

    gap: var(--md-comp-list-segmented-gap);
    padding: 0;
    /* min-width: 0 is required when this element is a grid or flex item so that
       white-space: nowrap content inside cannot expand the containing track. */
    min-width: 0;
    overflow: clip;
    border-radius: 16dp;
  }

  /* Item-root rounding for first/last/single — keeps selected-item container backgrounds
     correctly shaped when the item has a non-transparent background. */
  &_style_segmented :deep(.md-list-item_in-list:first-child),
  &_style_segmented :deep(.md-list-selection-item_in-list:first-child) {
    border-start-start-radius: 16dp;
    border-start-end-radius: 16dp;
  }

  &_style_segmented :deep(.md-list-item_in-list:last-child),
  &_style_segmented :deep(.md-list-selection-item_in-list:last-child) {
    border-end-start-radius: 16dp;
    border-end-end-radius: 16dp;
  }

  &_style_segmented :deep(.md-list-item_in-list:first-child:last-child),
  &_style_segmented :deep(.md-list-selection-item_in-list:first-child:last-child) {
    border-radius: 16dp;
  }

  /* Action-surface rounding: MDStateLayer and the ripple element both use
     border-radius: inherit, so shaping the action surface directly gives state layers
     and ripples the correct shape without container overflow clipping. */
  &_style_segmented :deep(.md-list-item_in-list:first-child .md-list-item__primary-action),
  &_style_segmented :deep(.md-list-item_in-list:first-child .md-list-item__body),
  &_style_segmented
    :deep(.md-list-selection-item_in-list:first-child .md-list-selection-item__body) {
    border-start-start-radius: 16dp;
    border-start-end-radius: 16dp;
  }

  &_style_segmented :deep(.md-list-item_in-list:last-child .md-list-item__primary-action),
  &_style_segmented :deep(.md-list-item_in-list:last-child .md-list-item__body),
  &_style_segmented
    :deep(.md-list-selection-item_in-list:last-child .md-list-selection-item__body) {
    border-end-start-radius: 16dp;
    border-end-end-radius: 16dp;
  }
}
</style>
