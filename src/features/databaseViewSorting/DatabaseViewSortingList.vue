<script setup lang="ts">
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument/state';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { templateRef } from '@vueuse/core';
import { useSortable } from '@vueuse/integrations/useSortable';

const viewsList = defineModel<[DatabaseViewId, DatabaseView][]>('viewsList');

const listContainer = templateRef('listContainer');

useSortable(listContainer, viewsList, {
  animation: 150,
});
</script>

<template>
  <MDListContainer ref="listContainer" class="database-view-list-dialog__list">
    <MDListItem
      v-for="([id, view], index) in viewsList"
      :key="id"
      class="database-view-list-dialog__item"
      :headline="view.name"
      :supporting-text="`${index} / ${view.order}`"
    />
  </MDListContainer>
</template>
