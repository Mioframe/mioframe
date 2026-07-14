<script setup lang="ts">
import { useSortable } from '@dnd-kit/vue/sortable';
import { useMediaQuery } from '@vueuse/core';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDListItem } from '@shared/ui/Lists';
import { computed, useTemplateRef } from 'vue';

const props = defineProps<{
  viewId: DatabaseViewId;
  index: number;
  labelText: string;
  mode: 'single-action' | 'multi-action';
  ariaCurrent?: 'true' | undefined;
}>();

const emit = defineEmits<{
  action: [];
}>();

defineSlots<{
  leading?: () => unknown;
  trailingAction?: () => unknown;
}>();

const itemRef = useTemplateRef<InstanceType<typeof MDListItem>>('itemRef');

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
// The @dnd-kit/vue sortable adapter merges this into its own transition defaults
// rather than treating `null` as "disable transition", so a reduced-motion
// preference is expressed as a zero-duration transition instead.
const transition = computed(() =>
  prefersReducedMotion.value
    ? { duration: 0 }
    : { duration: 350, easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.90)' },
);

const rootElement = computed(() => itemRef.value?.$el);

const { isDragging } = useSortable({
  id: () => props.viewId,
  index: () => props.index,
  element: rootElement,
  handle: () => itemRef.value?.getPrimaryActionElement() ?? undefined,
  transition,
});

const onAction = () => {
  emit('action');
};
</script>

<template>
  <MDListItem
    ref="itemRef"
    class="db-view-sortable-list-item"
    :label-text="labelText"
    :mode="mode"
    :aria-current="ariaCurrent"
    :dragged="isDragging"
    @action="onAction"
  >
    <template v-if="$slots.leading" #leading>
      <slot name="leading" />
    </template>

    <template v-if="$slots.trailingAction" #trailingAction>
      <slot name="trailingAction" />
    </template>
  </MDListItem>
</template>
