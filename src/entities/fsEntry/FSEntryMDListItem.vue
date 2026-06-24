<script setup lang="ts">
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { toRefs } from 'vue';

const props = defineProps<{
  name: string;
  type: FSNodeType;
  supportingText?: string | undefined;
  isButton?: boolean;
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
      isButton && !!slots.trailingAction ? 'multi-action' : isButton ? 'single-action' : 'static'
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

    <template v-if="isButton && !!slots.trailingAction" #trailingAction>
      <slot name="trailingAction" :entry="name" />
    </template>

    <template v-else-if="!isButton && !!slots.trailingAction" #trailing>
      <slot name="trailingAction" :entry="name" />
    </template>
  </MDListItem>
</template>
