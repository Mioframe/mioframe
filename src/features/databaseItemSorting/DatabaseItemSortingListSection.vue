<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDList } from '@shared/ui/Lists';
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import type { SORT_DIRECTION } from '@shared/lib/databaseDocument';
import {
  type DatabasePropertyId,
  type DatabaseViewId,
  zodDatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDSymbol } from '@shared/ui/Icon';
import type { MaybeElement } from '@vueuse/core';
import { MDIconButton } from '@shared/ui/Button';
import { MDButton } from '@shared/ui/material';
import { MDMenuBase } from '@shared/ui/Menu';
import { difference } from 'es-toolkit';
import { useReorderSurface, vReorderIgnore, vReorderItem } from '@shared/lib/sortable';
import { useDatabaseProperties } from '@entity/databaseProperty';
import { useDatabaseSorting } from '@entity/databaseSorting';
import PropertySortDirectionMenuItem from './PropertySortDirectionMenuItem.vue';
import DatabaseSortingListItem from './DatabaseSortingListItem.vue';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

defineSlots<{
  trailingAction: (p: { propertyId: DatabasePropertyId; direction: SORT_DIRECTION }) => unknown;
}>();

const { path, documentId, viewId } = toRefs(props);

const container = useTemplateRef<MaybeElement>('container');

const {
  sortingIdList,
  isLoading,
  reorder: reorderSorting,
  post: postSorting,
  remove: removeSorting,
} = useDatabaseSorting(path, documentId, viewId);

const { displayItemIdList, draggedId } = useReorderSurface(container, {
  itemIdList: sortingIdList,
  onCommit: ({ orderedIds }) => {
    const nextOrderedIds = orderedIds.filter((id) => zodIs(id, zodDatabasePropertyId));

    if (nextOrderedIds.length !== orderedIds.length) {
      return;
    }

    return reorderSorting(nextOrderedIds);
  },
});

const displaySortingIdList = computed(() =>
  displayItemIdList.value.filter((id) => zodIs(id, zodDatabasePropertyId)),
);
const draggedSortingId = computed(() => {
  const itemId = draggedId.value;

  return itemId && zodIs(itemId, zodDatabasePropertyId) ? itemId : undefined;
});

const isShowAddSortingMenu = ref(false);

const onClickAddSorting = () => {
  isShowAddSortingMenu.value = true;
};

const addSortingBtn = useTemplateRef<MaybeElement>('addSortingBtn');

const { propertiesIdList: databasePropertiesIdList } = useDatabaseProperties(path, documentId);

const propertyWithoutSorting = computed(() =>
  difference(databasePropertiesIdList.value ?? [], sortingIdList.value ?? []),
);

const onClickAddSortingMenu = async (propertyId: DatabasePropertyId) => {
  await postSorting(propertyId);
  isShowAddSortingMenu.value = false;
};

const onClickRemoveItem = async (propertyId: DatabasePropertyId) => {
  await removeSorting(propertyId);
};

const onInteractionOutside = () => {
  isShowAddSortingMenu.value = false;
};
</script>

<template>
  <section class="db-item-sorting-list-section">
    <MDCircularProgressIndicator v-if="isLoading && !sortingIdList" />

    <MDList v-if="displaySortingIdList.length" ref="container">
      <DatabaseSortingListItem
        v-for="propertyId in displaySortingIdList"
        :key="propertyId"
        v-reorder-item="propertyId"
        :path="path"
        :document-id="documentId"
        :view-id="viewId"
        :property-id="propertyId"
        :dragged="draggedSortingId === propertyId"
      >
        <template #trailingAction>
          <MDIconButton
            v-reorder-ignore
            color="standard"
            tooltip="remove"
            md-symbol-name="delete"
            @click="onClickRemoveItem(propertyId)"
          />
        </template>
      </DatabaseSortingListItem>
    </MDList>

    <div class="db-item-sorting-list-section__actions">
      <MDButton
        v-if="propertyWithoutSorting.length"
        ref="addSortingBtn"
        label="add sorting"
        @click="onClickAddSorting"
      >
        <template #icon>
          <MDSymbol name="add" />
        </template>
      </MDButton>
    </div>

    <MDMenuBase
      v-if="propertyWithoutSorting.length"
      v-model:show="isShowAddSortingMenu"
      :target="addSortingBtn"
      @interaction-outside="onInteractionOutside"
    >
      <PropertySortDirectionMenuItem
        v-for="propertyId in propertyWithoutSorting"
        :key="propertyId"
        :property-id="propertyId"
        :path="path"
        :document-id="documentId"
        @click="onClickAddSortingMenu(propertyId)"
      />
    </MDMenuBase>
  </section>
</template>

<style lang="css" scoped>
.db-item-sorting-list-section {
  &__actions {
    &:not(:first-child) {
      margin-top: 2step;
    }
  }
}

.flip {
  transform: rotateX(180deg);
}
</style>
