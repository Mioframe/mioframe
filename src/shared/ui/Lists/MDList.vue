<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useWarnSelectionListTagMismatch } from './listDevWarnings';
import {
  provideMDListContext,
  type MDListModelValue,
  type MDListSelectionMode,
  type MDListStyle,
} from './listContext';
import { useListSelectionKeyboard } from './useListSelectionKeyboard';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    is?: 'div' | 'ul' | undefined;
    modelValue?: MDListModelValue;
    listStyle?: MDListStyle | undefined;
    selectionMode?: MDListSelectionMode | undefined;
    tag?: 'div' | 'ul' | undefined;
    transition?: boolean | undefined;
  }>(),
  {
    listStyle: 'standard',
    selectionMode: 'none',
    tag: 'div',
    transition: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: MDListModelValue];
}>();

defineSlots<{
  default: () => unknown;
}>();

const containerEl = useTemplateRef('containerEl');

const getContainerElement = (): HTMLElement | null => {
  const value = containerEl.value;

  if (value instanceof HTMLElement) {
    return value;
  }

  if (value && typeof value === 'object' && '$el' in value && value.$el instanceof HTMLElement) {
    return value.$el;
  }

  return null;
};

const resolvedListStyle = computed<MDListStyle>(() => props.listStyle);

const resolvedTag = computed<'div' | 'ul'>(() =>
  props.selectionMode === 'none' ? (props.is ?? props.tag) : 'div',
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

useListSelectionKeyboard(getContainerElement, selectionActive, listContext.selectionRegistry);
</script>

<template>
  <TransitionGroup
    v-if="transition"
    ref="containerEl"
    :tag="resolvedTag"
    v-bind="$attrs"
    class="md-list"
    :class="[`md-list_style_${resolvedListStyle}`, `md-list_selection-mode_${selectionMode}`]"
    :role="containerRole"
    :aria-multiselectable="selectionMode === 'multiple' ? 'true' : undefined"
  >
    <slot />
  </TransitionGroup>

  <component
    :is="resolvedTag"
    v-else
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
  --md-private-list-item-content-padding-inline-start: 16dp;
  --md-private-list-item-content-padding-inline-end: 16dp;
  --md-private-list-item-content-padding-block: 10dp;
  --md-private-list-item-leading-space: 12dp;
  --md-private-list-item-leading-size: 20dp;
  --md-private-list-item-passive-trailing-min-size: 28dp;
  --md-private-list-item-segmented-gap: 0dp;
  --md-private-list-item-trailing-action-padding-inline-start: 8dp;
  --md-private-list-item-trailing-action-min-target-size: 48dp;
  --md-private-list-item-trailing-action-reserved: calc(
    var(--md-private-list-item-trailing-action-padding-inline-start) +
      var(--md-private-list-item-trailing-action-min-target-size)
  );
  --md-private-list-item-trailing-space: 16dp;

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
    --md-private-list-item-segmented-gap: 2dp;
    /* M3 Expressive segmented lists use filled items separated by gaps. The list
       container has no background; visual grouping comes from the item fill and the
       gaps that reveal the parent surface beneath. Item fill uses surface
       per the segmented list visual model. The private token cascades to item children,
       which derive --md-comp-list-list-item-container-color from it so that item-level
       overrides (selected, dragged) can still win via the public token. */
    --md-private-list-item-container-color: var(--md-sys-color-surface);

    gap: var(--md-private-list-item-segmented-gap);
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
