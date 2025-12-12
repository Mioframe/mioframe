<script setup lang="ts">
import {
  zodLOGICAL_FILTER_OPERATOR,
  zodUNARY_FILTER_OPERATOR,
  type DatabaseLogicalFilterList,
  type LOGICAL_FILTER_OPERATOR,
  type UNARY_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument/migrations/versions/v2/view/filter';
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import DatabaseNestedFilterString from './DatabaseNestedFilterString.vue';
import { OPERATOR_LABEL } from './types';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDMenu } from '@shared/ui/Menu';
import { useCurrentElement, type MaybeElement } from '@vueuse/core';
import { useConditionMenu } from './conditionMenuList';
import type {
  DatabaseNestedFilter,
  DatabaseValue,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDDialog } from '@shared/ui/Dialog';
import { useLastHover } from '@shared/lib/useLastHover';
import { useDatabaseProperties } from '@entity/databaseProperty';
import type { DomainError } from '@shared/lib/error';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    operator: LOGICAL_FILTER_OPERATOR;
    level?: number;
  }>(),
  { level: 0 },
);

const { directoryPath, operator, documentId } = toRefs(props);

const groupFilterModel = defineModel<DatabaseLogicalFilterList>('groupFilter', {
  required: true,
});

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

const { getProperty } = useDatabaseProperties();

const addBtnLabel = computed(() => OPERATOR_LABEL[operator.value]);

const addConditionBtn = useTemplateRef<MaybeElement>('addConditionBtn');

const onClickAddCondition = () => {
  showAddItemFilter.value = !showAddItemFilter.value;
};

const showAddItemFilter = ref(false);

const conditionMenuButtonList = useConditionMenu({
  directoryPath,
  documentId,
});

const selectedPropertyId = ref<DatabasePropertyId>();
const selectedOperator = ref<UNARY_FILTER_OPERATOR>();
const conditionValue = ref<DatabaseValue>();

const onClickAddItemFilter = ({
  key,
  propertyId,
}: {
  key: LOGICAL_FILTER_OPERATOR | UNARY_FILTER_OPERATOR | DatabasePropertyId;
  propertyId?: DatabasePropertyId;
}) => {
  if (zodIs(key, zodLOGICAL_FILTER_OPERATOR)) {
    groupFilterModel.value = [
      ...groupFilterModel.value,
      {
        [key]: [],
      },
    ];

    showAddItemFilter.value = false;
  } else if (zodIs(key, zodUNARY_FILTER_OPERATOR) && propertyId) {
    selectedPropertyId.value = propertyId;
    selectedOperator.value = key;
    showAddItemFilter.value = false;
  }
};

const showSimpleFilterDialog = computed({
  get: () => !!selectedPropertyId.value,
  set: (v) => {
    if (!v) {
      selectedPropertyId.value = undefined;
      selectedOperator.value = undefined;
      conditionValue.value = undefined;
    }
  },
});

const onUpdateFilter = (filter: DatabaseNestedFilter, index: number) => {
  groupFilterModel.value = groupFilterModel.value.toSpliced(index, 1, filter);
};

const onUpdateValue = (v: unknown) => {
  conditionValue.value = v;
};

const valueProperty = computed(() =>
  selectedPropertyId.value
    ? getProperty(
        directoryPath.value,
        documentId.value,
        selectedPropertyId.value,
      )
    : undefined,
);

const onApplySimpleFilter = () => {
  if (selectedPropertyId.value && selectedOperator.value) {
    groupFilterModel.value = [
      ...groupFilterModel.value,
      {
        [selectedPropertyId.value]: {
          [selectedOperator.value]: conditionValue.value,
        },
      },
    ];
  }

  selectedPropertyId.value = undefined;
  selectedOperator.value = undefined;
  conditionValue.value = undefined;
};

const hovered = useLastHover(useCurrentElement());

const onClickRemove = () => {
  emit('clickRemove');
};

const onClickRemoveFilter = (index: number) => {
  groupFilterModel.value = groupFilterModel.value.toSpliced(index, 1);
};
</script>

<template>
  <span
    class="filter-block md"
    :class="[
      `filter-block_${level % 2 === 0 ? 'even' : 'odd'}`,
      {
        'filter-block_hovered': hovered,
      },
    ]"
  >
    <span class="filter-block__actions">
      <span> {{ OPERATOR_LABEL[operator] }} </span>
    </span>

    <span class="filter-block__body">
      <template v-for="(item, index) in groupFilterModel" :key="index">
        <DatabaseNestedFilterString
          :directory-path="directoryPath"
          :document-id="documentId"
          :filter="item"
          :level="level + 1"
          @update:filter="onUpdateFilter($event, index)"
          @click-remove="onClickRemoveFilter(index)"
        >
          <template #valueField="{ property, propertyId, update, value }">
            <slot
              :value="value"
              :update="update"
              name="valueField"
              :property="property"
              :property-id="propertyId"
            />
          </template>
        </DatabaseNestedFilterString>
      </template>
    </span>

    <span class="filter-block__actions">
      <MDIconButton
        ref="addConditionBtn"
        :tooltip="addBtnLabel"
        size="extra-small"
        color="tonal"
        @click="onClickAddCondition"
      >
        <template #icon>
          <MDSymbol name="add" />
        </template>
      </MDIconButton>

      <MDIconButton
        tooltip="remove condition"
        size="extra-small"
        md-symbol-name="delete"
        @click="onClickRemove"
      />
    </span>

    <MDMenu
      v-model:show="showAddItemFilter"
      :target="addConditionBtn"
      :btns="conditionMenuButtonList"
      @click="onClickAddItemFilter"
    />

    <MDDialog
      v-model:show="showSimpleFilterDialog"
      headline="simpleFilterDialogHeadline"
      supporting-text="simpleFilterDialogSupportingText"
      apply-label="ok"
      has-cancel-action
      @apply="onApplySimpleFilter"
    >
      <slot
        v-if="selectedPropertyId && valueProperty"
        :value="conditionValue"
        :update="onUpdateValue"
        name="valueField"
        :property="valueProperty"
        :property-id="selectedPropertyId"
      />
    </MDDialog>
  </span>
</template>

<style lang="css" scoped>
@import './styles.css';
</style>
