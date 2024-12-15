<script setup lang="ts">
import {
  SORT_DIRECTION,
  type SortDirection,
} from '@shared/lib/databaseDocument';
import { UIButton } from '@shared/ui/Button';

defineProps<{
  direction: SortDirection;
}>();

const emit = defineEmits<{
  click: [];
}>();

const onClickSort = () => {
  emit('click');
};
</script>

<template>
  <UIButton @click="onClickSort">
    <template #icon>
      <i
        class="fa-solid fa-arrow-up-short-wide"
        :class="{
          'fa-flip-vertical': direction === SORT_DIRECTION.descending,
        }"
      />
    </template>
  </UIButton>
</template>
