<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useFileSystem } from './useFileSystem';

defineSlots<{
  leadingIcon: (p: { name: string }) => unknown;
}>();

const emit = defineEmits<{
  click: [name: string];
}>();

const { rootDirectory } = useFileSystem();

const onClickDirectory = (name: string) => {
  emit('click', name);
};
</script>

<template>
  <MDListContainer is="div">
    <MDListItem
      is="button"
      v-for="[name] in rootDirectory"
      :key="name"
      :headline="name"
      @click="onClickDirectory(name)"
    >
      <template #leadingIcon>
        <slot name="leadingIcon" v-bind="{ name }" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
