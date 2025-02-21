<script
  setup
  lang="ts"
  generic="
    Entry extends {
      name: string;
    }
  "
>
import { MDListContainer } from '@shared/ui/Lists';
import DirectoryContentEntry from './DirectoryContentEntry.vue';

const { entries } = defineProps<{
  entries: Iterable<[PropertyKey, Entry]>;
}>();

defineSlots<{
  trailing: (props: { entry: Entry; entryKey: PropertyKey }) => unknown;
}>();
</script>

<template>
  <MDListContainer>
    <DirectoryContentEntry
      v-for="[entryKey, entry] in entries"
      :key="entryKey"
      :entry="entry"
    >
      <template v-if="!!$slots.trailing" #trailing>
        <slot name="trailing" :entry :entry-key />
      </template>
    </DirectoryContentEntry>
  </MDListContainer>
</template>
