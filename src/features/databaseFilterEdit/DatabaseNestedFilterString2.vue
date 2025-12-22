<script setup lang="ts">
import { computed, toRefs } from 'vue';
import type {
  DatabaseLogicalFilterList,
  DatabaseNestedFilter,
  GeneralProperty,
  LOGICAL_FILTER_OPERATOR,
  UNARY_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument';
import {
  zodDatabaseLogicalFilterList,
  zodDatabasePropertyId,
  zodLOGICAL_FILTER_OPERATOR,
  zodUNARY_FILTER_OPERATOR,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import DatabaseSimpleFilterValueChip from './DatabaseSimpleFilterValueChip.vue';
import { zodIs } from '@shared/lib/validateZodScheme';
import DatabaseGroupFilterString from './DatabaseGroupFilterString2.vue';
import { useCurrentElement } from '@vueuse/core';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { omit } from 'es-toolkit';
import { useLastHover } from '@shared/lib/useLastHover';
import { useDatabaseProperty } from '@entity/databaseProperty';
import type { DomainError } from '@shared/lib/error';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    propertyId?: DatabasePropertyId;
    level?: number; // todo: перенести level в provide/inject
  }>(),
  {
    level: 0,
  },
);

const { directoryPath, documentId, propertyId } = toRefs(props);

defineSlots<{
  actions: () => unknown;
  valueField(p: {
    property: GeneralProperty | DomainError;
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const filterModel = defineModel<DatabaseNestedFilter>('filter', {
  required: true,
});

const { property } = useDatabaseProperty(directoryPath, documentId, propertyId);

const propertyName = computed(
  (): string => property.value?.name ?? propertyId.value ?? 'unknown',
);

const onUpdateFilter = (
  key: LOGICAL_FILTER_OPERATOR | DatabasePropertyId | UNARY_FILTER_OPERATOR,
  filter: DatabaseNestedFilter | DatabaseLogicalFilterList,
) => {
  filterModel.value = {
    ...filterModel.value,
    [key]: filter,
  };
};

const onClickRemoveFilter = (key: keyof DatabaseNestedFilter) => {
  filterModel.value = omit(filterModel.value, [key]);
};

const hovered = useLastHover(useCurrentElement());
</script>

<template>
  <span
    class="filter-block md"
    :class="[
      MD_SYS_TYPESCALE.title.medium,
      `filter-block_${level % 2 === 0 ? 'even' : 'odd'}`,
      {
        'filter-block_hovered': hovered,
      },
    ]"
  >
    <span class="filter-block__actions">
      <span v-if="property"> {{ propertyName }}</span>
    </span>

    <span class="filter-block__body">
      <template v-for="(value, key) in filterModel" :key="key">
        <DatabaseSimpleFilterValueChip
          v-if="zodIs(key, zodUNARY_FILTER_OPERATOR)"
          :operator="key"
          :value="value"
          @click-close="onClickRemoveFilter(key)"
        />

        <DatabaseNestedFilterString2
          v-else-if="zodIs(key, zodDatabasePropertyId)"
          :filter="value"
          :directory-path="directoryPath"
          :document-id="documentId"
          :property-id="key"
          :level="level + 1"
          @update:filter="onUpdateFilter(key, $event)"
          @click-remove="onClickRemoveFilter(key)"
        />

        <DatabaseGroupFilterString
          v-else-if="
            zodIs(key, zodLOGICAL_FILTER_OPERATOR) &&
            zodIs(value, zodDatabaseLogicalFilterList)
          "
          :directory-path="directoryPath"
          :document-id="documentId"
          :operator="key"
          :group-filter="value"
          :level="level + 1"
          @update:group-filter="onUpdateFilter(key, $event)"
          @click-remove="onClickRemoveFilter(key)"
        >
          <template
            #valueField="{
              property: scopeProperty,
              propertyId: scopePropertyId,
              update,
              value: scopeValue,
            }"
          >
            <slot
              :value="scopeValue"
              :update="update"
              name="valueField"
              :property="scopeProperty"
              :property-id="scopePropertyId"
            />
          </template>
        </DatabaseGroupFilterString>
      </template>
    </span>

    <span class="filter-block__actions">
      <slot name="actions"> - actions - </slot>
    </span>
  </span>
</template>

<style lang="css" scoped>
@import './styles.css';
</style>
