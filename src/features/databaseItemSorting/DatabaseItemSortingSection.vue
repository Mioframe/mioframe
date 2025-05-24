<script setup lang="ts">
import {
  SORT_DIRECTION,
  type DatabasePropertyId,
  type DatabaseSortList,
  type DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument/state';
import { useReduceIterable } from '@shared/lib/useReduce';
import { writableDeepClone } from '@shared/lib/writableDeepClone';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { MDMenu, defineMenuButtonList } from '@shared/ui/Menu';
import type { MaybeElement } from '@vueuse/core';
import { difference, isArray, keys } from 'remeda';
import { computed, ref, useTemplateRef, watchEffect } from 'vue';

/**
 * Порядок сортировки по значениям свойств.
 * - на первом месте опциональна ручная сортировка (в будущем)
 */

const { sortList, propertyMap } = defineProps<{
  propertyMap: DatabaseUnknownPropertiesMap;
  sortList?: DatabaseSortList;
}>();

const sortListState = ref<DatabaseSortList>([]);

watchEffect(() => {
  sortListState.value = writableDeepClone(sortList) ?? [];
});

/**
 * TODO: настройка сортировки
 *
 * список свойств
 * leadingIcon и supporting-text сообщают о направлении сортировки
 * нажатие на элемент списка меняет направление сортировки
 * в trailingIcon кнопка удаления сортировки из списка
 *
 * в конце списка кнопка добавления сортировки раскрывающая доступные свойства для сортировки
 *
 */

const addBtnRef = useTemplateRef<MaybeElement>('addBtn');

const showAddPropertyMenu = ref(false);

const propertyWithSorting = useReduceIterable(
  sortListState,
  (acc, item) => {
    if (!isArray(item)) {
      acc.push(item.propertyId);
    }
  },
  <DatabasePropertyId[]>[],
);

const propertyList = computed(() => keys(propertyMap));

const propertyWithoutSorting = computed(() =>
  difference(propertyList.value, propertyWithSorting.value),
);

const menu = computed(() =>
  defineMenuButtonList(
    propertyWithoutSorting.value.map((id) => [
      id,
      {
        text: propertyMap[id].name,
        symbolName: 'add',
      },
    ]),
  ),
);

const onClickMenuProperty = (propertyId: DatabasePropertyId) => {
  sortListState.value.push({
    propertyId,
    direction: SORT_DIRECTION.ascending,
  });
  showAddPropertyMenu.value = false;
};

const sortingList = useReduceIterable(
  sortListState,
  (acc, { direction, propertyId: id }) => {
    const { name } = propertyMap[id];

    acc.push({
      id,
      name,
      directionLabel:
        direction === SORT_DIRECTION.ascending
          ? 'Sort by ascending'
          : 'Sort by descending',
      direction,
    });
  },
  <
    {
      id: DatabasePropertyId;
      name: string;
      directionLabel: string;
      direction: SORT_DIRECTION;
    }[]
  >[],
);

const onClickRemove = (id: DatabasePropertyId) => {
  const foundIndex = sortListState.value.findIndex(
    ({ propertyId }) => propertyId === id,
  );

  sortListState.value.splice(foundIndex, 1);
};

const onClickToggleDirection = (id: DatabasePropertyId) => {
  const sortDescription = sortListState.value.find(
    ({ propertyId }) => propertyId === id,
  );

  if (sortDescription) {
    const oldDirection = sortDescription.direction;

    sortDescription.direction =
      oldDirection === SORT_DIRECTION.ascending
        ? SORT_DIRECTION.descending
        : SORT_DIRECTION.ascending;
  }
};
</script>

<template>
  <section class="database-item-sorting-section">
    <MDListContainer>
      <MDListItem
        v-for="item in sortingList"
        :key="item.id"
        :headline="item.name"
        :supporting-text="item.directionLabel"
        is-button
        @click="onClickToggleDirection(item.id)"
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
            tooltip="Remove sorting"
            md-symbol-name="delete"
            @click="onClickRemove(item.id)"
          />
        </template>
      </MDListItem>

      <MDListItem
        v-if="propertyWithoutSorting.length"
        ref="addBtn"
        headline="Add sorting"
        is-button
        @click="showAddPropertyMenu = !showAddPropertyMenu"
      >
        <template #leadingIcon>
          <MDSymbol name="add" />
        </template>
      </MDListItem>
    </MDListContainer>

    <MDMenu
      v-model:show="showAddPropertyMenu"
      :target-el="addBtnRef"
      :btns="menu"
      @click="onClickMenuProperty"
    />
  </section>
</template>

<style lang="css" scoped>
.flip {
  transform: rotateX(180deg);
}
</style>
