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
import { vPressedState } from '@shared/lib/md/stateHelper';

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
  <MDListContainer tag="div">
    <DirectoryContentEntry
      v-for="[entryKey, entry] in entries"
      :key="entryKey"
      v-pressed-state
      :entry="entry"
      @click="emit('click', entryKey, entry)"
    >
      <template v-if="!!$slots.trailing" #trailing>
        <slot name="trailing" :entry :entry-key />
      </template>
    </DirectoryContentEntry>
  </MDListContainer>
</template>
