<script setup lang="ts">
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument/migrations/versions';
import { useSortable } from '@shared/lib/sortable';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useTemplateRef } from 'vue';

const viewsList = defineModel<[DatabaseViewId, DatabaseView][]>('viewsList');

const listContainer =
  useTemplateRef<InstanceType<typeof MDListContainer>>('listContainer');

const { draggableIndex } = useSortable(listContainer, viewsList);

const slots = defineSlots<{
  trailingIcon: (p: { viewId: DatabaseViewId }) => unknown;
}>();
</script>

<template>
  <MDListContainer
    ref="listContainer"
    class="database-view-list"
    transition
    tag="div"
  >
    <MDListItem
      v-for="([viewId, view], index) in viewsList"
      :key="viewId"
      tag="button"
      class="database-view-list__item"
      :headline="view.name"
      draggable
      :class="{
        'md-state_grab': draggableIndex === index,
      }"
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
