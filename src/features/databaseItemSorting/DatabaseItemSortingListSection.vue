<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import {
  SORT_DIRECTION,
  type DatabasePropertyId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDSymbol } from '@shared/ui/Icon';
import type { MaybeElement } from '@vueuse/core';
import { MDButton, MDIconButton } from '@shared/ui/Button';
import { MDMenu } from '@shared/ui/Menu';
import { difference } from 'es-toolkit';
import type { EntryPath } from '@shared/lib/fileSystem';
import { useSortableListener } from '@shared/lib/sortable/useSortable';
import { useDatabaseViewSortingClient } from '@entity/databaseView/sortingClient';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import { DomainError } from '@shared/lib/error';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { directoryPath, documentId, viewId } = toRefs(props);

defineSlots<{
  trailingIcon: (p: {
    propertyId: DatabasePropertyId;
    direction: SORT_DIRECTION;
  }) => unknown;
}>();

const container = useTemplateRef<MaybeElement>('container');

const sortListValue = ref<
  {
    headline: string;
    propertyId: DatabasePropertyId;
    direction: SORT_DIRECTION;
    supportingText: string;
  }[]
>([]);

const {
  sortingPropertiesIdList: { get: getSortingPropertiesIdList },
  changePriority: changeSortingPriority,
  post: postSorting,
  patch: patchSorting,
  remove: removeSorting,
} = useDatabaseViewSortingClient();

const sortingPropertiesIdList = computed(
  () =>
    getSortingPropertiesIdList(
      directoryPath.value,
      documentId.value,
      viewId.value,
    ) ?? [],
);

const onMovedItem = async (fromIndex: number, toIndex: number) => {
  await changeSortingPriority(
    directoryPath.value,
    documentId.value,
    viewId.value,
    fromIndex,
    toIndex,
  );
};

const { draggableIndex } = useSortableListener(container, onMovedItem);

const isShowAddSortingMenu = ref(false);

const onClickAddSorting = () => {
  isShowAddSortingMenu.value = true;
};

const addSortingBtn = useTemplateRef<MaybeElement>('addSortingBtn');

const {
  databasePropertiesIdList: { get: getDatabasePropertiesIdList },
  getProperty: { get: getProperty },
} = useDatabasePropertiesClient();

const databasePropertiesIdList = computed(() => {
  const list = getDatabasePropertiesIdList(
    directoryPath.value,
    documentId.value,
  );

  if (list && !(list instanceof DomainError)) {
    return list;
  }

  return [];
});

const propertyWithoutSorting = computed(() =>
  difference(databasePropertiesIdList.value, sortingPropertiesIdList.value),
);

const sortingOptions = computed(() =>
  propertyWithoutSorting.value.map((propertyId) => {
    const property = getProperty(
      directoryPath.value,
      documentId.value,
      propertyId,
    );

    return {
      label: property?.name ?? 'unknown property',
      key: propertyId,
      direction: SORT_DIRECTION.ascending,
    };
  }),
);

const onClickAddSortingMenu = async ({
  key: propertyId,
}: {
  key: DatabasePropertyId;
}) => {
  await postSorting(
    directoryPath.value,
    documentId.value,
    viewId.value,
    propertyId,
  );
  isShowAddSortingMenu.value = false;
};

const onClickSortingItem = async (
  propertyId: DatabasePropertyId,
  direction: SORT_DIRECTION,
) => {
  await patchSorting(
    directoryPath.value,
    documentId.value,
    viewId.value,
    propertyId,
    {
      direction:
        direction === SORT_DIRECTION.ascending
          ? SORT_DIRECTION.descending
          : SORT_DIRECTION.ascending,
    },
  );
};

const onClickRemoveItem = async (propertyId: DatabasePropertyId) => {
  await removeSorting(
    directoryPath.value,
    documentId.value,
    viewId.value,
    propertyId,
  );
};
</script>

<template>
  <section class="db-item-sorting-list-section">
    <MDListContainer v-if="sortListValue.length" ref="container">
      <MDListItem
        is="button"
        v-for="(item, index) in sortListValue"
        :key="item.propertyId"
        :headline="item.headline"
        draggable
        :supporting-text="item.supportingText"
        :class="{
          'md-state_drag': draggableIndex === index,
        }"
        @click="onClickSortingItem(item.propertyId, item.direction)"
      >
        <template #leadingIcon>
          <MDSymbol
            name="sort"
            :class="{
              flip: item.direction === SORT_DIRECTION.ascending,
            }"
          />
        </template>

        <template #trailingIcon>
          <MDIconButton
            color="standard"
            tooltip="remove"
            md-symbol-name="delete"
            @click="onClickRemoveItem(item.propertyId)"
          />
        </template>
      </MDListItem>
    </MDListContainer>

    <div class="db-item-sorting-list-section__actions">
      <MDButton
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
      v-model:show="isShowAddSortingMenu"
      :btns="sortingOptions"
      :target="addSortingBtn"
      @interaction-outside="isShowAddSortingMenu = false"
      @click="onClickAddSortingMenu"
    />
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
