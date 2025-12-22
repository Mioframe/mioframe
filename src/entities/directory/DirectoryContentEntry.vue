<script setup lang="ts">
import { FileType } from '@shared/lib/virtualFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';

const props = defineProps<{
  name: string;
  type: FileType;
}>();

const slots = defineSlots<{
  trailing: unknown;
}>();
</script>

<template>
  <MDListItem
    is="button"
    :headline="props.name"
    class="directory-content-entry"
  >
    <template #leadingIcon>
      <MDSymbol v-if="type === FileType.Directory" name="folder" />

      <MDSymbol v-else name="draft" />
    </template>

    <template v-if="slots.trailing" #trailingIcon>
      <slot name="trailing" />
    </template>
  </MDListItem>
</template>

<style lang="css" scoped>
.directory-content-entry {
  border-radius: 8px;
}
</style>
