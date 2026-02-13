<script setup lang="ts">
import { MDListContainer } from '@shared/ui/Lists';
import DirectoryContentEntry from './DirectoryContentEntry.vue';
import { useDirectory } from './useDirectory';
import { toRefs } from 'vue';
import { PathUtils } from '@shared/lib/virtualFileSystem';

const props = defineProps<{
  path: string;
}>();

const { path } = toRefs(props);

const slots = defineSlots<{
  trailing: (props: { path: string }) => unknown;
}>();

const emit = defineEmits<{
  click: [path: string];
}>();

const { data: state } = useDirectory(path);
</script>

<template>
  <MDListContainer is="div">
    <DirectoryContentEntry
      v-for="[name, { type }] in state"
      :key="name"
      :type="type"
      :name="name"
      @click="emit('click', path)"
    >
      <template v-if="!!slots.trailing" #trailing>
        <slot name="trailing" :path="PathUtils.join(path, name)" />
      </template>
    </DirectoryContentEntry>
  </MDListContainer>
</template>
