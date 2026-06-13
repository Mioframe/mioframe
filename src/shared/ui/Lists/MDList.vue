<script setup lang="ts">
import { computed, warn } from 'vue';
import { provideMDListContext, type MDListDensity, type MDListStyle } from './listContext';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    density?: MDListDensity | undefined;
    is?: 'div' | 'ul' | undefined;
    tag?: 'div' | 'ul' | undefined;
    listStyle?: MDListStyle | undefined;
    transition?: boolean | undefined;
  }>(),
  {
    density: 'baseline',
    tag: 'div',
    listStyle: 'standard',
    transition: false,
  },
);

defineSlots<{
  default: () => unknown;
}>();

const resolvedTag = computed(() => props.is ?? props.tag);

const resolvedListStyle = computed<MDListStyle>(() => {
  if (props.listStyle === 'segmented' && props.density === 'baseline') {
    if (import.meta.env.DEV) {
      warn(
        'MDList: listStyle="segmented" requires density="expressive". Falling back to expressive density semantics for this list.',
      );
    }
  }

  return props.listStyle;
});

const resolvedDensity = computed<MDListDensity>(() =>
  props.listStyle === 'segmented' ? 'expressive' : props.density,
);

provideMDListContext(resolvedListStyle, resolvedDensity, resolvedTag);

const containerRole = computed(() => (resolvedTag.value === 'ul' ? null : 'list'));
</script>

<template>
  <TransitionGroup
    v-if="transition"
    :tag="resolvedTag"
    v-bind="$attrs"
    class="md-list"
    :class="[`md-list_style_${resolvedListStyle}`, `md-list_density_${resolvedDensity}`]"
    :role="containerRole"
  >
    <slot />
  </TransitionGroup>

  <component
    :is="resolvedTag"
    v-else
    v-bind="$attrs"
    class="md-list"
    :class="[`md-list_style_${resolvedListStyle}`, `md-list_density_${resolvedDensity}`]"
    :role="containerRole"
  >
    <slot />
  </component>
</template>

<style scoped>
.md-list {
  --md-list-item-action-shape: 0dp;
  --md-list-item-wrapper-shape: 0dp;
  --md-list-item-gap: 0dp;
  --md-list-item-leading-gap: 16dp;
  --md-list-item-padding-inline: 16dp;
  --md-list-item-padding-inline-end: 24dp;
  --md-list-item-padding-block: 8dp;
  --md-list-item-passive-trailing-min-size: 24dp;
  --md-list-item-leading-size: 24dp;
  --md-list-item-supporting-lines: 1;

  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  list-style: none;

  &_density_expressive {
    --md-list-item-action-shape: 12dp;
    --md-list-item-wrapper-shape: 4dp;
    --md-list-item-gap: 12dp;
    --md-list-item-leading-gap: 12dp;
    --md-list-item-padding-inline-end: 16dp;
    --md-list-item-padding-block: 10dp;
    --md-list-item-passive-trailing-min-size: 28dp;
    --md-list-item-leading-size: 20dp;
  }

  &_style_segmented {
    gap: 2dp;
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

  &_density_baseline :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_density_baseline :deep(.md-list-item_line-count_3 .md-list-item__body),
  &_density_expressive :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_density_expressive :deep(.md-list-item_line-count_3 .md-list-item__body) {
    align-items: flex-start;
  }

  &_density_baseline :deep(.md-list-item_line-count_3 .md-list-item__primary-action),
  &_density_baseline :deep(.md-list-item_line-count_3 .md-list-item__body) {
    --md-list-item-padding-block: 12dp;
  }
}
</style>
