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

provideMDListContext(
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

useListSelectionKeyboard(getContainerElement, selectionActive);
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
  --md-private-list-item-action-shape: 12dp;
  --md-private-list-item-container-shape: 12dp;
  --md-private-list-item-content-padding-inline-start: 16dp;
  --md-private-list-item-content-padding-inline-end: 16dp;
  --md-private-list-item-content-padding-block: 10dp;
  --md-private-list-item-leading-space: 12dp;
  --md-private-list-item-leading-size: 20dp;
  --md-private-list-item-passive-trailing-min-size: 28dp;
  --md-private-list-item-segmented-gap: 0dp;
  --md-private-list-item-trailing-action-reserved: 56dp; /* 8dp padding-start + 48dp min-width */
  --md-private-list-item-trailing-space: 16dp;

  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  list-style: none;
  background: transparent;
  color: var(--md-current-content-color, var(--md-content-color, inherit));

  &_style_segmented {
    --md-container-color: var(
      --md-sys-color-surface-container-low,
      var(--md-sys-color-surface-container)
    );
    --md-content-color: var(--md-sys-color-on-surface);
    --md-private-list-item-segmented-gap: 2dp;

    gap: var(--md-private-list-item-segmented-gap);
    padding: 0;
    overflow: clip;
    border-radius: 16dp;
    background: var(--md-current-container-color, var(--md-container-color));
  }

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
}
</style>
