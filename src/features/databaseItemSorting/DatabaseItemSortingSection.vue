<script setup lang="ts">
import {
  SORT_DIRECTION,
  type DatabasePropertyId,
  type DatabaseSortMap,
  type DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument/state';
import { objectEntries } from '@shared/lib/objectEntries';
import { useReduceIterable } from '@shared/lib/useReduce';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { MDMenu, defineMenuButtonList } from '@shared/ui/Menu';
import type { MaybeElement } from '@vueuse/core';
import { difference, isArray, keys } from 'remeda';
import { computed, ref, useTemplateRef } from 'vue';

/**
 * Порядок сортировки по значениям свойств.
 * - на первом месте опциональна ручная сортировка (в будущем)
 */

const { propertyMap } = defineProps<{
  propertyMap: DatabaseUnknownPropertiesMap;
}>();

const sortMapModel = defineModel<DatabaseSortMap>('sortMap', {
  required: true,
});

const sortList = computed({
  get: () =>
    objectEntries(sortMapModel.value)
      .sort(([, { priority: a }], [, { priority: b }]) => a - b)
      .map(([id, { direction }]) => ({
        id,
        direction,
      })),
  set: (v: { id: DatabasePropertyId; direction: SORT_DIRECTION }[]) => {
    v.forEach(({ direction, id }, priority) => {
      sortMapModel.value[id] = {
        direction,
        priority,
      };
    });
  },
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
  sortList,
  (acc, item) => {
    if (!isArray(item)) {
      acc.push(item.id);
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

const onClickMenuProperty = (id: DatabasePropertyId) => {
  sortList.value.push({
    id,
    direction: SORT_DIRECTION.ascending,
  });
  showAddPropertyMenu.value = false;
};

const sortingList = useReduceIterable(
  sortList,
  (acc, { direction, id }) => {
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
  const foundIndex = sortList.value.findIndex(
    ({ id: propertyId }) => propertyId === id,
  );

  sortList.value.splice(foundIndex, 1);
};

const onClickToggleDirection = (id: DatabasePropertyId) => {
  const sortDescription = sortList.value.find(
    ({ id: propertyId }) => propertyId === id,
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
