<script
  setup
  lang="ts"
  generic="Entry extends { name: string; entries?: unknown }"
>
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';

const { entry: item } = defineProps<{
  entry: Entry;
}>();

defineSlots<{
  trailing: unknown;
}>();
</script>

<template>
  <MDListItem :headline="item.name">
    <template #leadingIcon>
      <MDSymbol v-if="'entries' in item" name="folder" />

      <MDSymbol v-else name="draft" />
    </template>

    <template v-if="$slots.trailing" #trailingIcon>
      <slot name="trailing" />
    </template>
  </MDListItem>
</template>
