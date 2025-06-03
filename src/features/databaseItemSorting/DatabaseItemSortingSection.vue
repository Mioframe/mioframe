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
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { MDMenu, defineMenuButtonList } from '@shared/ui/Menu';
import type { MaybeElement } from '@vueuse/core';
import {
  moveArrayElement,
  useSortable,
} from '@vueuse/integrations/useSortable';
import { cloneDeep } from 'es-toolkit';
import { isNumber, isUndefined } from 'es-toolkit/compat';
import { difference, isArray, keys } from 'remeda';
import {
  computed,
  nextTick,
  ref,
  toValue,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';

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
    id: DatabasePropertyId;
    direction: SORT_DIRECTION;
  }[]
>([]);

watch(
  sortMapModel,
  (sortMapModel) => {
    deepReplaceJSONObject(
      stateSortList.value,
      objectEntries(sortMapModel)
        .sort(([, { priority: a }], [, { priority: b }]) => a - b)
        .map(([id, { direction }]) => ({
          id,
          direction,
        })),
    );
  },
  { immediate: true, deep: true },
);

watch(
  stateSortList,
  (stateSortList) => {
    deepReplaceJSONObject(
      sortMapModel.value,
      stateSortList.reduce<DatabaseSortMap>(
        (acc, { direction, id }, priority) => ({
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
    acc.push(item.id);
  },
  <DatabasePropertyId[]>[],
);

const propertyList = computed(() => keys(propertyMapRef.value));

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
    id,
    direction: SORT_DIRECTION.ascending,
  });
  showAddPropertyMenu.value = false;
};

const onClickRemove = (id: DatabasePropertyId) => {
  const foundIndex = stateSortList.value.findIndex(
    ({ id: propertyId }) => propertyId === id,
  );

  stateSortList.value.splice(foundIndex, 1);
};

const onClickToggleDirection = (id: DatabasePropertyId) => {
  const sortDescription = stateSortList.value.find(
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

const listContainerRef = useTemplateRef('listContainerRef');

// TODO: совместить с MDListContainer и состоянием drag у элементов
useSortable(listContainerRef, stateSortList, {
  animation: 200,
  delay: 900, // time in milliseconds to define when the sorting should start
  delayOnTouchOnly: false, // only delay if user is using touch
});
</script>

<template>
  <section class="database-item-sorting-section">
    <MDListContainer ref="listContainerRef" tag="div">
      <MDListItem
        v-for="item in stateSortList"
        :key="item.id"
        :headline="propertyMap[item.id].name"
        :supporting-text="
          item.direction === SORT_DIRECTION.ascending
            ? 'Sort by ascending'
            : 'Sort by descending'
        "
        is-button
        @click="onClickToggleDirection(item.id)"
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
