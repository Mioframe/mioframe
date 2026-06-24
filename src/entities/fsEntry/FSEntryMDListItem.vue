<script setup lang="ts">
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { toRefs } from 'vue';

const props = defineProps<{
  name: string;
  type: FSNodeType;
  supportingText?: string | undefined;
  // Domain intent: whether this entry can be opened (e.g. a directory or an importable
  // file). Drives whether the row renders as an actionable MDListItem.
  isOpenable?: boolean;
}>();

const emit = defineEmits<{
  click: [name: string];
}>();

const slots = defineSlots<{
  trailingAction(): unknown;
}>();

const { name } = toRefs(props);

const onListItemClick = () => {
  emit('click', name.value);
};
</script>

<template>
  <MDListItem
    :mode="
      isOpenable && !!slots.trailingAction
        ? 'multi-action'
        : isOpenable
          ? 'single-action'
          : 'static'
    "
    :label-text="name"
    :supporting-text="supportingText"
    @action="onListItemClick"
  >
    <template #leading>
      <MDSymbol v-if="type === FSNodeType.Directory" name="folder" />

      <MDSymbol v-else-if="type === FSNodeType.File" name="draft" />

      <MDSymbol v-else name="insert_page_break" />
    </template>

    <template v-if="isOpenable && !!slots.trailingAction" #trailingAction>
      <slot name="trailingAction" :entry="name" />
    </template>

    <template v-else-if="!isOpenable && !!slots.trailingAction" #trailing>
      <slot name="trailingAction" :entry="name" />
    </template>
  </MDListItem>
</template>
