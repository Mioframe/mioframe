<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useMountedDirectories } from './useMountedDirectories';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';

withDefaults(
  defineProps<{
    is?: 'button' | 'li';
  }>(),
  {
    is: 'li',
  },
);

const emit = defineEmits<{
  click: [directory: DirectoryFSEntry];
}>();

const { map: mountedMap } = useMountedDirectories();

const onClickDirectory = (directory: DirectoryFSEntry) => {
  emit('click', directory);
};
</script>

<template>
  <MDListContainer>
    <MDListItem
      :is="is"
      v-for="[name, directory] in mountedMap"
      :key="name"
      :headline="name"
      @click="onClickDirectory(directory)"
    />
  </MDListContainer>
</template>
