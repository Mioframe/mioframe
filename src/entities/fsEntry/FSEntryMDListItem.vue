<script
  setup
  lang="ts"
  generic="
    Entry extends FileFSEntry | DirectoryFSEntry,
    Key extends PropertyKey
  "
>
import type { DirectoryFSEntry, FileFSEntry } from '@shared/lib/fileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';

const {} = defineProps<{
  entry: Entry;
  entryKey: Key;
  supportingText?: string;
  isButton?: boolean;
}>();

defineEmits<{
  click: [entryKey: Key, entry: Entry];
}>();

const slots = defineSlots<{
  trailingIcon(p: { entryName: string }): unknown;
}>();
</script>

<template>
  <MDListItem
    :is="isButton ? 'button' : undefined"
    :headline="entry.name"
    :supporting-text="supportingText"
    @click="$emit('click', entryKey, entry)"
  >
    <template #leadingIcon>
      <MDSymbol v-if="'entries' in entry" name="folder" />

      <MDSymbol v-else name="draft" />
    </template>

    <template v-if="!!slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" :entry-name="entry.name" />
    </template>
  </MDListItem>
</template>
