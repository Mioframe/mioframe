<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef } from 'vue';
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
import DatabaseGroupFilterString from './DatabaseGroupFilterString.vue';
import { MDIconButton } from '@shared/ui/Button';
import { MDMenu } from '@shared/ui/Menu';
import { useCurrentElement, type MaybeElement } from '@vueuse/core';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDSymbol } from '@shared/ui/Icon';
import { MDDialog } from '@shared/ui/Dialog';
import { useConditionMenu } from './conditionMenuList';
import { omit } from 'es-toolkit';
import { useLastHover } from '@shared/lib/useLastHover';
import { useDatabaseProperty } from '@entity/databaseProperty';
import type { DomainError } from '@shared/lib/error';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    propertyId?: DatabasePropertyId;
    disableProperties?: boolean;
    level?: number;
  }>(),
  {
    level: 0,
  },
);

const { directoryPath, documentId, propertyId, disableProperties } =
  toRefs(props);

const emit = defineEmits<{
  clickRemove: [];
}>();

defineSlots<{
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

const showAddConditionMenu = ref(false);

const onClickAddCondition = () => {
  showAddConditionMenu.value = true;
};

const addConditionBtn = useTemplateRef<MaybeElement>('addConditionBtn');

/**
 * @deprecated разделить на компоненты
 */
const conditionMenuButtonList = useConditionMenu({
  directoryPath,
  documentId,
  filter: filterModel,
  propertyId,
  disableProperties,
});

const addGroupCondition = (operator: LOGICAL_FILTER_OPERATOR) => {
  filterModel.value = {
    ...filterModel.value,
    [operator]: [],
  };
};

const selectedNewPropertyId = ref<DatabasePropertyId>();
const selectedNewSimpleOperator = ref<UNARY_FILTER_OPERATOR>();

const onClickMenuCondition = ({
  key,
  propertyId,
}: {
  key: LOGICAL_FILTER_OPERATOR | DatabasePropertyId | UNARY_FILTER_OPERATOR;
  propertyId?: DatabasePropertyId;
}) => {
  if (zodIs(key, zodLOGICAL_FILTER_OPERATOR)) {
    addGroupCondition(key);
    showAddConditionMenu.value = false;
  }
  if (zodIs(key, zodUNARY_FILTER_OPERATOR) && propertyId) {
    selectedNewSimpleOperator.value = key;
    selectedNewPropertyId.value = propertyId;
    showAddConditionMenu.value = false;
  }
};

const showSimpleFilterDialog = computed({
  get: () => !!selectedNewPropertyId.value,
  set: (v) => {
    if (!v) {
      selectedNewPropertyId.value = undefined;
      newSimpleFilterValue.value = undefined;
    }
  },
});

const newSimpleFilterValue = ref<unknown>();

const onUpdateNewSimpleFilterValue = (v: unknown) => {
  newSimpleFilterValue.value = v;
};

const filterFormProperty = computed(() =>
  selectedNewPropertyId.value
    ? getProperty(
        directoryPath.value,
        documentId.value,
        selectedNewPropertyId.value,
      )
    : undefined,
);

const onApplyNewSimpleFilter = () => {
  if (selectedNewSimpleOperator.value) {
    if (propertyId.value && propertyId.value === selectedNewPropertyId.value) {
      filterModel.value = {
        ...filterModel.value,
        [selectedNewSimpleOperator.value]: newSimpleFilterValue.value,
      };
    } else if (selectedNewPropertyId.value) {
      filterModel.value = {
        ...filterModel.value,
        [selectedNewPropertyId.value]: {
          [selectedNewSimpleOperator.value]: newSimpleFilterValue.value,
        },
      };
    }
  }
  newSimpleFilterValue.value = undefined;
  selectedNewPropertyId.value = undefined;
};

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

const addButtonLabel = computed(() =>
  property.value ? `add "${propertyName.value}"` : 'add',
);

const hovered = useLastHover(useCurrentElement());

const onClickRemove = () => {
  emit('clickRemove');
};
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

        <DatabaseNestedFilterString
          v-else-if="zodIs(key, zodDatabasePropertyId)"
          :filter="value"
          :directory-path="directoryPath"
          :document-id="documentId"
          :property-id="key"
          disable-properties
          :level="level + 1"
          @update:filter="onUpdateFilter(key, $event)"
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
        </DatabaseNestedFilterString>

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
      <MDIconButton
        ref="addConditionBtn"
        :tooltip="addButtonLabel"
        size="extra-small"
        color="tonal"
        @click="onClickAddCondition"
      >
        <template #icon>
          <MDSymbol name="add" />
        </template>
      </MDIconButton>

      <MDIconButton
        v-if="level > 0"
        tooltip="remove condition"
        size="extra-small"
        md-symbol-name="delete"
        @click="onClickRemove"
      />
    </span>

    <MDMenu
      v-model:show="showAddConditionMenu"
      :target="addConditionBtn"
      :btns="conditionMenuButtonList"
      @click="onClickMenuCondition"
    >
      <!-- todo: список кнопок -->
    </MDMenu>

    <MDDialog
      v-model:show="showSimpleFilterDialog"
      headline="simpleFilterDialogHeadline"
      supporting-text="simpleFilterDialogSupportingText"
      apply-label="Add"
      has-cancel-action
      @apply="onApplyNewSimpleFilter"
    >
      <slot
        v-if="selectedNewPropertyId && filterFormProperty"
        :value="newSimpleFilterValue"
        :update="onUpdateNewSimpleFilterValue"
        name="valueField"
        :property="filterFormProperty"
        :property-id="selectedNewPropertyId"
      />
    </MDDialog>
  </span>
</template>

<style lang="css" scoped>
@import './styles.css';
</style>
