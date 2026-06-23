<script setup lang="ts">
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';

const props = defineProps<{
  name: string;
  type: FSNodeType;
}>();

const slots = defineSlots<{
  trailingAction: unknown;
}>();
</script>

<template>
  <MDListItem mode="static" :label-text="props.name">
    <template #leading>
      <MDSymbol v-if="type === FSNodeType.Directory" name="folder" />

      <MDSymbol v-else name="draft" />
    </template>

    <template v-if="slots.trailingAction" #trailing>
      <slot name="trailingAction" />
    </template>
  </MDListItem>
</template>
