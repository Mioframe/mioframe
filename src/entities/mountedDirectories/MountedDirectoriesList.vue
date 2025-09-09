<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useMountedDirectories } from './useMountedDirectories';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';

withDefaults(
  defineProps<{
    is?: 'button' | 'li';
  }>(),
  {
    is: 'li',
  },
);

defineSlots<{
  leadingIcon: (p: { name: string }) => unknown;
}>();

const emit = defineEmits<{
  click: [name: string];
}>();

const { store } = useMountedDirectories();

const strictRecord = useWrapStrictRecord(store);

const onClickDirectory = (name: string) => {
  emit('click', name);
};
</script>

<template>
  <MDListContainer>
    <MDListItem
      :is="is"
      v-for="[name] in strictRecord?.entries"
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
