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

const emit = defineEmits<{
  click: [entryKey: PropertyKey, entry: Entry];
}>();
</script>

<template>
  <MDListContainer is="div">
    <DirectoryContentEntry
      v-for="[entryKey, entry] in entries"
      :key="entryKey"
      :entry="entry"
      @click="emit('click', entryKey, entry)"
    >
      <template v-if="!!$slots.trailing" #trailing>
        <slot name="trailing" :entry="entry" :entry-key="entryKey" />
      </template>
    </DirectoryContentEntry>
  </MDListContainer>
</template>
