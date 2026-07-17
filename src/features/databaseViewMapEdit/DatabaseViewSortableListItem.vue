<script setup lang="ts">
import { useReorderItem } from '@shared/lib/reorder';
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

const rootElement = computed(() => itemRef.value?.$el);

const { isDragging } = useReorderItem({
  id: () => props.viewId,
  index: () => props.index,
  element: rootElement,
  handle: () => itemRef.value?.getPrimaryActionElement() ?? undefined,
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
