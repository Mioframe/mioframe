<script setup lang="ts">
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument/state';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { templateRef } from '@vueuse/core';
import { useSortable } from '@vueuse/integrations/useSortable';

const viewsList = defineModel<[DatabaseViewId, DatabaseView][]>('viewsList');

const listContainer = templateRef('listContainer');

useSortable(listContainer, viewsList, {
  animation: 150,
  handle: '.database-view-list__grab',
});

const slots = defineSlots<{
  trailingIcon: (p: { viewId: DatabaseViewId }) => unknown;
}>();
</script>

<template>
  <MDListContainer ref="listContainer" class="database-view-list">
    <MDListItem
      v-for="([viewId, view], index) in viewsList"
      :key="viewId"
      class="database-view-list__item"
      :headline="view.name"
      :supporting-text="`${index} / ${view.order}`"
    >
      <template #leadingAvatarContainer>
        <MDIconButton tooltip="drag" class="database-view-list__grab">
          <template #icon>
            <MDSymbol name="drag_indicator" />
          </template>
        </MDIconButton>
      </template>

      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot name="trailingIcon" :view-id="viewId" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>

<style lang="css" scoped>
.database-view-list {
  overflow-y: auto;
  flex-shrink: 1;
  --md-list-container-border-radius: 16px;
  row-gap: 1px;

  &__item {
    --md-list-item-border-radius: 8px;
  }

  &__grab {
    cursor: grab;
  }
}
</style>
