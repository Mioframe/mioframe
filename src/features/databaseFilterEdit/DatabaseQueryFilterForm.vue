<script setup lang="ts">
import { DatabaseFilterQuery, useDatabaseViewFilter } from '@entity/databaseFilter';
import { DatabasePropertySpan } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseViewId,
  UNARY_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument';
import { LOGICAL_FILTER_OPERATOR, zodDatabasePropertyId } from '@shared/lib/databaseDocument';
import DatabaseFilterAddButton from './DatabaseFilterAddButton.vue';
import { computed, ref, toRefs } from 'vue';
import DatabaseUnaryFilterFormDialog from './DatabaseUnaryFilterFormDialog.vue';
import { get, set } from 'es-toolkit/compat';
import { isUndefined } from 'es-toolkit';
import { isArray, isEnumValue } from '@shared/lib/typeGuards';
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDIconButton } from '@shared/ui/Button';
import type { FilterPath } from './types';
import { zodFilterPath } from './types';
const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

defineSlots<{
  value: (p: { value: unknown; propertyId: DatabasePropertyId }) => unknown;
  valueField: (p: {
    value: unknown;
    propertyId: DatabasePropertyId;
    updateValue: (value: unknown) => void;
  }) => unknown;
}>();

const { path: directoryPath, documentId, viewId } = toRefs(props);

const temporaryStateNewFilter = ref<{
  operator: UNARY_FILTER_OPERATOR;
  parentOperators: FilterPath;
  value: unknown;
}>();

const temporaryPropertyId = computed(() =>
  temporaryStateNewFilter.value?.parentOperators.find((v) => zodIs(v, zodDatabasePropertyId)),
);

const onClickAddFilter = ({
  operator,
  parentOperators = [],
}: {
  operator: UNARY_FILTER_OPERATOR;
  parentOperators?: FilterPath;
}) => {
  temporaryStateNewFilter.value = {
    operator,
    parentOperators,
    value: undefined,
  };
};

const {
  patch: patchFilter,
  filterQuery,
  remove: removeFilter,
} = useDatabaseViewFilter(directoryPath, documentId, viewId);

const onApplyFilterForm = async () => {
  if (temporaryStateNewFilter.value) {
    const { operator, parentOperators, value } = temporaryStateNewFilter.value;
    if (!isUndefined(value)) {
      const source = {};

      set(
        source,
        parentOperators.reduce((pathSegments: PropertyKey[], key) => {
          if (isEnumValue(key, LOGICAL_FILTER_OPERATOR)) {
            const oldLogicalValue: unknown = get(filterQuery.value, pathSegments, undefined);

            const order = isArray(oldLogicalValue) ? oldLogicalValue.length : 0;

            pathSegments.push(key, order);
            return pathSegments;
          }

          pathSegments.push(key);
          return pathSegments;
        }, []),
        { [operator]: value },
      );

      await patchFilter(source);
    }
  }

  temporaryStateNewFilter.value = undefined;
};

const onCancelFilterForm = () => {
  temporaryStateNewFilter.value = undefined;
};

const onUpdateTemporaryFilterValue = (value: unknown) => {
  if (temporaryStateNewFilter.value) {
    temporaryStateNewFilter.value.value = value;
  }
};

const onClickRemove = async (pathFilter: PropertyKey[]) => {
  await removeFilter(pathFilter);
};

// todo: корневая первая кнопка добавления фильтра должна быть более понятной
// todo: назначение кнопок And и Or не понятны
// todo: меню создания фильтра не понятное
</script>

<template>
  <div class="database-query-filter-form">
    <DatabaseFilterQuery
      :directory-path="directoryPath"
      :document-id="documentId"
      :view-id="viewId"
      class="__DatabaseFilterQuery"
    >
      <template #property="{ propertyId }">
        <DatabasePropertySpan
          :path="directoryPath"
          :document-id="documentId"
          :property-id="propertyId"
        />
      </template>

      <template #value="{ value, path: filterPath, property }">
        <slot
          v-if="zodIs(property, zodDatabasePropertyId)"
          name="value"
          :value="value"
          :property-id="property"
        >
          <span>Unsupported filter value renderer</span>
        </slot>

        <span v-else>Unsupported filter value renderer</span>

        <MDIconButton
          :tooltip="`remove object ${filterPath.join('.')}`"
          md-symbol-name="delete"
          size="extra-small"
          @click="onClickRemove(filterPath)"
        />
      </template>

      <template #objectAppend="{ path: filterPath }">
        <DatabaseFilterAddButton
          v-if="zodIs(filterPath, zodFilterPath)"
          :filter-path="filterPath"
          :directory-path="directoryPath"
          :document-id="documentId"
          @click-unary="onClickAddFilter"
        />
      </template>

      <template #groupAppend="{ path: filterPath }">
        <DatabaseFilterAddButton
          v-if="zodIs(filterPath, zodFilterPath)"
          :filter-path="filterPath"
          :directory-path="directoryPath"
          :document-id="documentId"
          @click-unary="onClickAddFilter"
        />
      </template>
    </DatabaseFilterQuery>

    <DatabaseUnaryFilterFormDialog
      v-if="temporaryStateNewFilter"
      :operator="temporaryStateNewFilter.operator"
      @cancel="onCancelFilterForm"
      @apply="onApplyFilterForm"
    >
      <template v-if="temporaryPropertyId" #valueField>
        <slot
          name="valueField"
          :value="temporaryStateNewFilter.value"
          :property-id="temporaryPropertyId"
          :update-value="onUpdateTemporaryFilterValue"
        >
          <span>Unsupported filter value editor</span>
        </slot>
      </template>
    </DatabaseUnaryFilterFormDialog>
  </div>
</template>

<style lang="css" scoped>
.database-query-filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  .__DatabaseFilterQuery {
    --md-container-color: inherit;
  }
}
</style>
