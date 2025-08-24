<script setup lang="ts">
import {
  zodDatabaseLogicalFilterList,
  zodDatabaseUnaryCondition,
  zodLOGICAL_FILTER_OPERATOR,
  zodUNARY_FILTER_OPERATOR,
  type DatabaseNestedFilter,
} from '@shared/lib/databaseDocument/migrations/versions/v2/view/filter';
import { keys } from '@shared/lib/objectKeys';
import { computed, toRefs } from 'vue';
import {
  useDatabasePropertiesMap,
  zodDatabasePropertyId,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import type { AMDocHandle } from '@shared/lib/automerge';
import DatabaseSimpleFilterValueChip from './DatabaseSimpleFilterValueChip.vue';
import { zodIs } from '@shared/lib/validateZodScheme';
import DatabaseGroupFilterString from './DatabaseGroupFilterString.vue';

const props = defineProps<{
  condition: DatabaseNestedFilter;
  propertyId?: DatabasePropertyId;
  docHandle: AMDocHandle;
}>();

const { condition, docHandle, propertyId } = toRefs(props);

const properties = useDatabasePropertiesMap(docHandle);

const property = computed(() =>
  propertyId.value ? properties.get(propertyId.value) : undefined,
);

const propertyName = computed(
  (): string => property.value?.name ?? propertyId.value ?? 'unknown',
);

const lastIndex = computed(() => keys(condition.value).length - 1);
</script>

<template>
  <span class="db-nested-filter-string">
    <template v-if="lastIndex > 0">( </template>

    <template v-for="(value, key, index) in condition" :key="key">
      <DatabaseSimpleFilterValueChip
        v-if="zodIs(key, zodUNARY_FILTER_OPERATOR)"
        :property-name="propertyName"
        :operator="key"
        :value="value"
      />

      <DatabaseNestedFilterString
        v-else-if="
          zodIs(key, zodDatabasePropertyId) &&
          zodIs(value, zodDatabaseUnaryCondition)
        "
        :condition="value"
        :doc-handle="docHandle"
        :property-id="key"
      />

      <DatabaseGroupFilterString
        v-else-if="
          zodIs(key, zodLOGICAL_FILTER_OPERATOR) &&
          zodIs(value, zodDatabaseLogicalFilterList)
        "
        :operator="key"
        :group-filter-value="value"
        :doc-handle="docHandle"
      />

      <template v-if="index < lastIndex"> and </template>
    </template>

    <template v-if="lastIndex > 0"> )</template>
  </span>
</template>
