<script setup lang="ts">
import { computed, useTemplateRef, warn } from 'vue';
import {
  provideMDListContext,
  type MDListModelValue,
  type MDListSelectionMode,
  type MDListStyle,
  type MDListVariant,
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
    variant?: MDListVariant | undefined;
  }>(),
  {
    listStyle: 'standard',
    selectionMode: 'none',
    tag: 'div',
    transition: false,
    variant: 'baseline',
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

const resolvedVariant = computed<MDListVariant>(() => {
  if (props.listStyle === 'segmented' && props.variant === 'baseline') {
    if (import.meta.env.DEV) {
      warn(
        'MDList: listStyle="segmented" requires variant="expressive". Falling back to expressive variant semantics for this list.',
      );
    }

    return 'expressive';
  }

  return props.variant;
});

const resolvedListStyle = computed<MDListStyle>(() => {
  if (props.selectionMode !== 'none' && props.tag === 'ul') {
    if (import.meta.env.DEV) {
      warn(
        'MDList: selectionMode lists render as div/listbox containers. Falling back from tag="ul" to tag="div".',
      );
    }
  }

  return props.listStyle;
});

const resolvedTag = computed<'div' | 'ul'>(() =>
  props.selectionMode === 'none' ? (props.is ?? props.tag) : 'div',
);

provideMDListContext(
  resolvedListStyle,
  resolvedVariant,
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
    :class="[
      `md-list_style_${resolvedListStyle}`,
      `md-list_variant_${resolvedVariant}`,
      `md-list_selection-mode_${selectionMode}`,
    ]"
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
    :class="[
      `md-list_style_${resolvedListStyle}`,
      `md-list_variant_${resolvedVariant}`,
      `md-list_selection-mode_${selectionMode}`,
    ]"
    :role="containerRole"
    :aria-multiselectable="selectionMode === 'multiple' ? 'true' : undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
.md-list {
  --md-private-list-item-action-shape: 0dp;
  --md-private-list-item-container-shape: 0dp;
  --md-private-list-item-content-padding-inline-start: 16dp;
  --md-private-list-item-content-padding-inline-end: 24dp;
  --md-private-list-item-content-padding-block: 8dp;
  --md-private-list-item-leading-space: 16dp;
  --md-private-list-item-leading-size: 24dp;
  --md-private-list-item-passive-trailing-min-size: 24dp;
  --md-private-list-item-segmented-gap: 0dp;
  --md-private-list-item-trailing-space: 16dp;

  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  list-style: none;

  &_variant_expressive {
    --md-private-list-item-action-shape: 12dp;
    --md-private-list-item-container-shape: 12dp;
    --md-private-list-item-content-padding-inline-end: 16dp;
    --md-private-list-item-content-padding-block: 10dp;
    --md-private-list-item-leading-space: 12dp;
    --md-private-list-item-passive-trailing-min-size: 28dp;
    --md-private-list-item-leading-size: 20dp;
  }

  &_style_segmented {
    --md-private-list-item-segmented-gap: 2dp;

    gap: var(--md-private-list-item-segmented-gap);
    padding: 0;
    overflow: clip;
    border-radius: 16dp;
    background: var(--md-sys-color-surface-container-low, var(--md-sys-color-surface-container));
  }

  &_style_segmented :deep(.md-list-item_in-list),
  &_style_segmented :deep(.md-list-selection-item_in-list) {
    background: var(--md-sys-color-surface);
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

  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__body),
  &_variant_baseline :deep(.md-list-selection-item_line-count_3 .md-list-selection-item__body),
  &_variant_expressive :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_variant_expressive :deep(.md-list-item_line-count_3 .md-list-item__body),
  &_variant_expressive :deep(.md-list-selection-item_line-count_3 .md-list-selection-item__body) {
    align-items: flex-start;
  }

  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__body),
  &_variant_baseline :deep(.md-list-selection-item_line-count_3 .md-list-selection-item__body) {
    --md-private-list-item-content-padding-block: 12dp;
  }
}
</style>
