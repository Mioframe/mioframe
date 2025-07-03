<script setup lang="ts">
import type { DatabaseSortDirection } from '@shared/lib/databaseDocument/migrations/versions';
import { SORT_DIRECTION } from '@shared/lib/databaseDocument/migrations/versions';
import { UIButton } from '@shared/ui/Button';

defineProps<{
  direction: DatabaseSortDirection;
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
