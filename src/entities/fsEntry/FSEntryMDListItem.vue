<script setup lang="ts">
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { toRefs } from 'vue';

const props = defineProps<{
  name: string;
  type: FSNodeType;
  supportingText?: string;
  isButton?: boolean;
}>();

const { name } = toRefs(props);

defineEmits<{
  click: [name: string];
}>();

const slots = defineSlots<{
  trailingIcon(): unknown;
}>();
</script>

<template>
  <MDListItem
    :is="isButton ? 'button' : undefined"
    :headline="name"
    :supporting-text="supportingText"
    @click="$emit('click', name)"
  >
    <template #leadingIcon>
      <MDSymbol v-if="type === FSNodeType.Directory" name="folder" />

      <MDSymbol v-else-if="type === FSNodeType.File" name="draft" />

      <MDSymbol v-else name="insert_page_break" />
    </template>

    <template v-if="!!slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" :entry="name" />
    </template>
  </MDListItem>
</template>
