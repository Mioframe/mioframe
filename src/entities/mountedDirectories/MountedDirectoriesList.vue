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

defineSlots<{
  leadingIcon: (p: { name: string; directory: DirectoryFSEntry }) => unknown;
}>();

const emit = defineEmits<{
  click: [directory: DirectoryFSEntry];
}>();

const { map: mountedDirectories } = useMountedDirectories();

const onClickDirectory = (directory: DirectoryFSEntry) => {
  emit('click', directory);
};
</script>

<template>
  <MDListContainer>
    <MDListItem
      :is="is"
      v-for="[name, { entry, description }] in mountedDirectories"
      :key="name"
      :headline="name"
      :supporting-text="description"
      @click="onClickDirectory(entry)"
    >
      <template #leadingIcon>
        <slot name="leadingIcon" v-bind="{ name, directory: entry }" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
