<script setup lang="ts">
import {
  DatabaseFilterQuery,
  useDatabaseViewFilter,
} from '@entity/databaseFilter';
import { DatabasePropertySpan } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseViewId,
  UNARY_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument';
import {
  LOGICAL_FILTER_OPERATOR,
  zodDatabasePropertyId,
} from '@shared/lib/databaseDocument';
import DatabaseFilterAddButton from './DatabaseFilterAddButton.vue';
import { computed, ref, toRefs } from 'vue';
import DatabaseUnaryFilterFormDialog from './DatabaseUnaryFilterFormDialog.vue';
import { get, set } from 'es-toolkit/compat';
import { isUndefined } from 'es-toolkit';
import { isArray, isEnumValue } from '@shared/lib/typeGuards';
// FIXME: violation FSD
import ValueField from '@widget/DocumentView/Database/ValueField.vue';
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDIconButton } from '@shared/ui/Button';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { path, documentId, viewId } = toRefs(props);

const temporaryStateNewFilter = ref<{
  operator: UNARY_FILTER_OPERATOR;
  parentOperators: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
  value: unknown;
}>();

const temporaryPropertyId = computed(() =>
  temporaryStateNewFilter.value?.parentOperators.find((v) =>
    zodIs(v, zodDatabasePropertyId),
  ),
);

const onClickAddFilter = ({
  operator,
  parentOperators,
}: {
  operator: UNARY_FILTER_OPERATOR;
  parentOperators: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
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
} = useDatabaseViewFilter(path, documentId, viewId);

const onApplyFilterForm = async () => {
  if (temporaryStateNewFilter.value) {
    const { operator, parentOperators, value } = temporaryStateNewFilter.value;
    if (!isUndefined(value)) {
      const source = {};

      set(
        source,
        [LOGICAL_FILTER_OPERATOR.$and, ...parentOperators].reduce(
          (path: PropertyKey[], key) => {
            if (isEnumValue(key, LOGICAL_FILTER_OPERATOR)) {
              const oldLogicalValue: unknown = get(
                filterQuery.value,
                path,
                undefined,
              );

              const order = isArray(oldLogicalValue)
                ? oldLogicalValue.length
                : 0;

              return [...path, key, order];
            }

            return [...path, key];
          },
          [],
        ),
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

const onClickRemove = async (pathFilter: PropertyKey[]) => {
  await removeFilter(pathFilter);
};
</script>

<template>
  <DatabaseFilterQuery
    :directory-path="path"
    :document-id="documentId"
    :view-id="viewId"
  >
    <template #property="{ propertyId }">
      <DatabasePropertySpan
        :path="path"
        :document-id="documentId"
        :property-id="propertyId"
      />
    </template>

    <template #objectAppend="{ path: queryPath }">
      <MDIconButton
        :tooltip="`remove object ${queryPath.join('.')}`"
        md-symbol-name="delete"
        size="extra-small"
        @click="onClickRemove(queryPath)"
      />
    </template>

    <template #groupAppend="{ path: groupPath }">
      <MDIconButton
        :tooltip="`remove group ${groupPath.join('.')}`"
        md-symbol-name="delete"
        size="extra-small"
        @click="onClickRemove(groupPath)"
      />
    </template>

    <template #append>
      <DatabaseFilterAddButton
        :path="path"
        :document-id="documentId"
        @click-unary="onClickAddFilter"
      />

      <DatabaseUnaryFilterFormDialog
        v-if="temporaryStateNewFilter"
        :show="!!temporaryStateNewFilter"
        :operator="temporaryStateNewFilter.operator"
        @cancel="onCancelFilterForm"
        @apply="onApplyFilterForm"
      >
        <template v-if="temporaryPropertyId" #valueField>
          <ValueField
            v-model:value="temporaryStateNewFilter.value"
            :directory-path="path"
            :document-id="documentId"
            :property-id="temporaryPropertyId"
            autofocus
          />
        </template>
      </DatabaseUnaryFilterFormDialog>
    </template>
  </DatabaseFilterQuery>
</template>
