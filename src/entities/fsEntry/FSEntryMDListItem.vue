<script setup lang="ts">
import type { EntryDescription } from '@shared/service/directories';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';

const {} = defineProps<{
  entry: EntryDescription;
  supportingText?: string;
  isButton?: boolean;
}>();

defineEmits<{
  click: [entry: EntryDescription];
}>();

const slots = defineSlots<{
  trailingIcon(p: { entry: EntryDescription }): unknown;
}>();
</script>

<template>
  <MDListItem
    :is="isButton ? 'button' : undefined"
    :headline="entry.name"
    :supporting-text="supportingText"
    @click="$emit('click', entry)"
  >
    <template #leadingIcon>
      <MDSymbol v-if="entry.type === 'directory'" name="folder" />

      <MDSymbol v-else name="draft" />
    </template>

    <template v-if="!!slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" :entry="entry" />
    </template>
  </MDListItem>
</template>
