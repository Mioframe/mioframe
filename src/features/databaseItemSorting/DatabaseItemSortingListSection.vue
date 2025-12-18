<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDListContainer } from '@shared/ui/Lists';
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import type { SORT_DIRECTION } from '@shared/lib/databaseDocument';
import {
  type DatabasePropertyId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDSymbol } from '@shared/ui/Icon';
import type { MaybeElement } from '@vueuse/core';
import { MDButton, MDIconButton } from '@shared/ui/Button';
import { MDMenu } from '@shared/ui/Menu';
import { difference } from 'es-toolkit';
import { useSortableListener } from '@shared/lib/sortable/useSortable';
import { useDatabaseProperties } from '@entity/databaseProperty';
import { useDatabaseSorting } from '@entity/databaseSorting/useDatabaseSorting';
import PropertySortDirectionMenuItem from './PropertySortDirectionMenuItem.vue';
import DatabaseSortingListItem from './DatabaseSortingListItem.vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { path, documentId, viewId } = toRefs(props);

defineSlots<{
  trailingIcon: (p: {
    propertyId: DatabasePropertyId;
    direction: SORT_DIRECTION;
  }) => unknown;
}>();

const container = useTemplateRef<MaybeElement>('container');

const {
  sortingIdList,
  changePriority: changeSortingPriority,
  post: postSorting,
  remove: removeSorting,
} = useDatabaseSorting(path, documentId, viewId);

const onMovedItem = async (fromIndex: number, toIndex: number) => {
  await changeSortingPriority(fromIndex, toIndex);
};

const { draggableIndex } = useSortableListener(container, onMovedItem);

const isShowAddSortingMenu = ref(false);

const onClickAddSorting = () => {
  isShowAddSortingMenu.value = true;
};

const addSortingBtn = useTemplateRef<MaybeElement>('addSortingBtn');

const { propertiesIdList: databasePropertiesIdList } = useDatabaseProperties(
  path,
  documentId,
);

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
</script>

<template>
  <section class="db-item-sorting-list-section">
    <MDListContainer v-if="sortingIdList?.length" ref="container">
      <DatabaseSortingListItem
        v-for="(propertyId, index) in sortingIdList"
        :key="propertyId"
        :path="path"
        :document-id="documentId"
        :view-id="viewId"
        :property-id="propertyId"
        :class="{
          'md-state_drag': draggableIndex === index,
        }"
      >
        <template #trailingIcon>
          <MDIconButton
            color="standard"
            tooltip="remove"
            md-symbol-name="delete"
            @click="onClickRemoveItem(propertyId)"
          />
        </template>
      </DatabaseSortingListItem>
    </MDListContainer>

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

    <MDMenu
      v-if="propertyWithoutSorting.length"
      v-model:show="isShowAddSortingMenu"
      :target="addSortingBtn"
      @interaction-outside="isShowAddSortingMenu = false"
    >
      <PropertySortDirectionMenuItem
        v-for="propertyId in propertyWithoutSorting"
        :key="propertyId"
        :property-id="propertyId"
        :path="path"
        :document-id="documentId"
        @click="onClickAddSortingMenu(propertyId)"
      />
    </MDMenu>
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
