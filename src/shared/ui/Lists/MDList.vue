<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, onUpdated, useTemplateRef, warn } from 'vue';
import {
  provideMDListContext,
  type MDListModelValue,
  type MDListSelectionMode,
  type MDListStyle,
  type MDListVariant,
} from './listContext';

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

const syncOptionTabStops = () => {
  if (props.selectionMode === 'none') {
    return;
  }

  const container = getContainerElement();

  if (!container) {
    return;
  }

  const options = Array.from(
    container.querySelectorAll<HTMLElement>('[data-md-list-option="true"]'),
  );

  if (!options.length) {
    return;
  }

  const selectedOption =
    options.find((option) => option.getAttribute('aria-selected') === 'true') ?? options[0];
  const activeOption =
    document.activeElement instanceof HTMLElement &&
    options.some((option) => option === document.activeElement)
      ? document.activeElement
      : selectedOption;

  for (const option of options) {
    option.tabIndex = option === activeOption ? 0 : -1;
  }
};

const focusOption = (target: HTMLElement) => {
  const container = getContainerElement();

  if (!container) {
    return;
  }

  const options = Array.from(
    container.querySelectorAll<HTMLElement>('[data-md-list-option="true"]'),
  );

  for (const option of options) {
    option.tabIndex = option === target ? 0 : -1;
  }

  target.focus();
};

const moveFocus = (event: KeyboardEvent, direction: 'first' | 'last' | 1 | -1) => {
  if (props.selectionMode === 'none') {
    return;
  }

  const container = getContainerElement();
  const currentTarget = event.target;

  if (!(container && currentTarget instanceof HTMLElement)) {
    return;
  }

  const currentOption = currentTarget.closest<HTMLElement>('[data-md-list-option="true"]');

  if (!currentOption) {
    return;
  }

  const options = Array.from(
    container.querySelectorAll<HTMLElement>('[data-md-list-option="true"]'),
  );
  const currentIndex = options.findIndex((option) => option === currentOption);

  if (currentIndex === -1) {
    return;
  }

  const nextOption =
    direction === 'first'
      ? options[0]
      : direction === 'last'
        ? options.at(-1)
        : options.at((currentIndex + direction + options.length) % options.length);

  if (!nextOption) {
    return;
  }

  event.preventDefault();
  focusOption(nextOption);
};

const onFocusin = (event: FocusEvent) => {
  if (props.selectionMode === 'none' || !(event.target instanceof HTMLElement)) {
    return;
  }

  const option = event.target.closest<HTMLElement>('[data-md-list-option="true"]');

  if (option) {
    focusOption(option);
  }
};

const onKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      moveFocus(event, 1);
      return;
    case 'ArrowUp':
    case 'ArrowLeft':
      moveFocus(event, -1);
      return;
    case 'Home':
      moveFocus(event, 'first');
      return;
    case 'End':
      moveFocus(event, 'last');
      return;
  }
};

const handleFocusin = (event: Event) => {
  if (event instanceof FocusEvent) {
    onFocusin(event);
  }
};

const handleKeydown = (event: Event) => {
  if (event instanceof KeyboardEvent) {
    onKeydown(event);
  }
};

onMounted(() => {
  const container = getContainerElement();

  container?.addEventListener('focusin', handleFocusin);
  container?.addEventListener('keydown', handleKeydown);
  void nextTick(syncOptionTabStops);
});

onUnmounted(() => {
  const container = getContainerElement();

  container?.removeEventListener('focusin', handleFocusin);
  container?.removeEventListener('keydown', handleKeydown);
});

onUpdated(() => {
  void nextTick(syncOptionTabStops);
});
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
  --md-list-item-action-shape: 0dp;
  --md-list-item-container-shape: 0dp;
  --md-list-item-content-padding-inline-start: 16dp;
  --md-list-item-content-padding-inline-end: 24dp;
  --md-list-item-content-padding-block: 8dp;
  --md-list-item-leading-space: 16dp;
  --md-list-item-leading-size: 24dp;
  --md-list-item-passive-trailing-min-size: 24dp;
  --md-list-item-segmented-gap: 0dp;
  --md-list-item-trailing-space: 16dp;

  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  list-style: none;

  &_variant_expressive {
    --md-list-item-action-shape: 12dp;
    --md-list-item-container-shape: 12dp;
    --md-list-item-content-padding-inline-end: 16dp;
    --md-list-item-content-padding-block: 10dp;
    --md-list-item-leading-space: 12dp;
    --md-list-item-passive-trailing-min-size: 28dp;
    --md-list-item-leading-size: 20dp;
  }

  &_style_segmented {
    --md-list-item-segmented-gap: 2dp;

    gap: var(--md-list-item-segmented-gap);
    padding: 0;
    overflow: clip;
    border-radius: 16dp;
    background: var(--md-sys-color-surface-container-low, var(--md-sys-color-surface-container));
  }

  &_style_segmented :deep(.md-list-item_in-list) {
    background: var(--md-sys-color-surface);
  }

  &_style_segmented :deep(.md-list-item_in-list:first-child) {
    border-start-start-radius: 16dp;
    border-start-end-radius: 16dp;
  }

  &_style_segmented :deep(.md-list-item_in-list:last-child) {
    border-end-start-radius: 16dp;
    border-end-end-radius: 16dp;
  }

  &_style_segmented :deep(.md-list-item_in-list:first-child:last-child) {
    border-radius: 16dp;
  }

  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__body),
  &_variant_expressive :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_variant_expressive :deep(.md-list-item_line-count_3 .md-list-item__body) {
    align-items: flex-start;
  }

  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_variant_baseline :deep(.md-list-item_line-count_3 .md-list-item__body) {
    --md-list-item-content-padding-block: 12dp;
  }
}
</style>
