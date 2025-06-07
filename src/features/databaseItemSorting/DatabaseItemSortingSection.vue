<script setup lang="ts">
import { deepReplaceJSONObject } from '@shared/lib/changeObject';
import {
  SORT_DIRECTION,
  type DatabasePropertyId,
  type DatabaseSortMap,
  type DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument/state';
import { objectEntries } from '@shared/lib/objectEntries';
import { useDeepModel } from '@shared/lib/useDeepModel';
import { useReduceIterable } from '@shared/lib/useReduce';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDList, MDListContainer, MDListItem } from '@shared/ui/Lists';
import { MDMenu, defineMenuButtonList } from '@shared/ui/Menu';
import type { MaybeElement } from '@vueuse/core';
import { keys } from 'es-toolkit/compat';
import { difference } from 'remeda';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';

/**
 * Порядок сортировки по значениям свойств.
 * - на первом месте опциональна ручная сортировка (в будущем)
 */

const props = defineProps<{
  propertyMap: DatabaseUnknownPropertiesMap;
  // eslint-disable-next-line vue/no-unused-properties -- use in useDeepModel
  sortMap: DatabaseSortMap;
}>();

const emit = defineEmits<{
  'update:sortMap': [DatabaseSortMap];
}>();

const propertyMapRef = computed(() => props.propertyMap);

const sortMapModel = useDeepModel(props, 'sortMap', emit);

const stateSortList = ref<
  {
    key: DatabasePropertyId;
    direction: SORT_DIRECTION;
    headline: string;
    supportingText?: string;
  }[]
>([]);

const watchHandlerStateSortList = watch(
  stateSortList,
  (stateSortList) => {
    deepReplaceJSONObject(
      sortMapModel.value,
      stateSortList.reduce<DatabaseSortMap>(
        (acc, { direction, key: id }, priority) => ({
          ...acc,
          [id]: {
            direction,
            priority,
          },
        }),
        {},
      ),
    );
  },
  { deep: true },
);

watch(
  sortMapModel,
  (sortMapModel) => {
    watchHandlerStateSortList.pause();
    deepReplaceJSONObject(
      stateSortList.value,
      objectEntries(sortMapModel)
        .sort(([, { priority: a }], [, { priority: b }]) => a - b)
        .map(([id, { direction }]) => ({
          key: id,
          direction,
          headline: propertyMapRef.value[id].name,
          supportingText:
            direction === SORT_DIRECTION.ascending
              ? 'Sort by ascending'
              : 'Sort by descending',
        })),
    );
    void nextTick(() => {
      watchHandlerStateSortList.resume();
    });
  },
  { immediate: true, deep: true },
);

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
  stateSortList,
  (acc, item) => {
    acc.push(item.key);
  },
  <DatabasePropertyId[]>[],
);

const propertyList = computed(
  () => <(keyof typeof propertyMapRef.value)[]>keys(propertyMapRef.value),
);

const propertyWithoutSorting = computed(() =>
  difference(propertyList.value, propertyWithSorting.value),
);

const menu = computed(() =>
  defineMenuButtonList(
    propertyWithoutSorting.value.map((id) => [
      id,
      {
        text: propertyMapRef.value[id].name,
        symbolName: 'add',
      },
    ]),
  ),
);

const onClickMenuProperty = (id: DatabasePropertyId) => {
  stateSortList.value.push({
    key: id,
    direction: SORT_DIRECTION.ascending,
    headline: propertyMapRef.value[id].name,
    supportingText: 'Sort by ascending',
  });
  showAddPropertyMenu.value = false;
};

const onClickRemove = (id: DatabasePropertyId) => {
  const foundIndex = stateSortList.value.findIndex(
    ({ key: propertyId }) => propertyId === id,
  );

  stateSortList.value.splice(foundIndex, 1);
};

const onClickToggleDirection = (id: DatabasePropertyId) => {
  const sortDescription = stateSortList.value.find(
    ({ key: propertyId }) => propertyId === id,
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
    <MDListContainer ref="listContainerRef" tag="div">
      <MDListItem
        v-for="item in stateSortList"
        :key="item.key"
        :headline="propertyMap[item.key].name"
        :supporting-text="
          item.direction === SORT_DIRECTION.ascending
            ? 'Sort by ascending'
            : 'Sort by descending'
        "
        tag="button"
        @click="onClickToggleDirection(item.key)"
      >
        <template #leadingIcon>
          <MDSymbol
            name="sort"
            :class="{
              flip: item.direction === SORT_DIRECTION.ascending,
            }"
            class="handle"
          />
        </template>

        <template #trailingIcon>
          <MDIconButton
            tooltip="Remove sorting"
            md-symbol-name="delete"
            @click="onClickRemove(item.key)"
          />
        </template>
      </MDListItem>

      <MDListItem
        v-if="propertyWithoutSorting.length"
        ref="addBtn"
        headline="Add sorting"
        tag="button"
        @click="showAddPropertyMenu = !showAddPropertyMenu"
      >
        <template #leadingIcon>
          <MDSymbol name="add" />
        </template>
      </MDListItem>
    </MDListContainer>

    <MDList
      v-model:list="stateSortList"
      sortable
      @click-item="onClickToggleDirection($event.key)"
    >
      <template #leadingIcon="{ item }">
        <MDSymbol
          name="sort"
          :class="{
            flip: item.direction === SORT_DIRECTION.ascending,
          }"
          class="handle"
        />
      </template>

      <template #trailingIcon="{ item }">
        <MDIconButton
          tooltip="Remove sorting"
          md-symbol-name="delete"
          @click="onClickRemove(item.key)"
        />
      </template>
    </MDList>

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
