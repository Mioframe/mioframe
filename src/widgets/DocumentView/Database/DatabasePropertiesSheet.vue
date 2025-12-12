<script setup lang="ts">
import { DatabasePropertyList } from '@entity/databaseProperty';
import { DatabasePropertyRemoveDialog } from '@feature/databasePropertyRemove';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { ref } from 'vue';
import PropertyCreateDialogWidget from './PropertyCreateDialogWidget.vue';
import { DatabasePropertyEditDialog } from '@feature/databasePropertyEdit';
import { DatabaseRelationPropertyEditSection } from '@feature/databaseRelationPropertyEdit';
import { zodIs } from '@shared/lib/validateZodScheme';
import { zodRelationProperty } from '@entity/databaseRelation';
import { DatabaseBooleanPropertyEditSection } from '@feature/databaseBooleanPropertyEdit';
import { zodBooleanProperty } from '@entity/databaseBoolean';
import ValueField from './ValueField.vue';

defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const showModel = defineModel<boolean>('show', { required: true });

enum PROPERTY_ACTION {
  remove,
  edit,
}

const propertyContextBtns = defineMenuButtonList([
  {
    label: 'Edit',
    symbolName: 'edit',
    key: PROPERTY_ACTION.edit,
  },
  {
    label: 'Remove',
    symbolName: 'delete',
    key: PROPERTY_ACTION.remove,
  },
]);

const removePropertyId = ref<DatabasePropertyId>();

const editPropertyId = ref<DatabasePropertyId>();

const onClickPropertyContextAction = (
  { key: action }: { key: PROPERTY_ACTION },
  propertyId: DatabasePropertyId,
) => {
  switch (action) {
    case PROPERTY_ACTION.remove: {
      removePropertyId.value = propertyId;
      break;
    }
    case PROPERTY_ACTION.edit: {
      editPropertyId.value = propertyId;
      break;
    }

    default:
      throw new Error('unknown property action');
  }
};

const onUpdateCollapsed = (collapsed: boolean) => {
  if (collapsed) {
    showModel.value = false;
  }
};

const isShowAddProperty = ref(false);
</script>

<template>
  <MDBottomSheet
    v-model:show="showModel"
    class="db-properties-sheet"
    label="Database Properties Sheet"
    @update:collapsed="onUpdateCollapsed"
  >
    <MDBottomSheetSection class="db-properties-sheet__section">
      <span :class="MD_SYS_TYPESCALE.title.small">Properties</span>

      <DatabasePropertyList
        class="db-properties-sheet__property-list"
        :directory-path="directoryPath"
        :document-id="documentId"
      >
        <template #trailingIcon="{ propertyId, property }">
          <MDContextMenuButton
            :btns="propertyContextBtns"
            :tooltip="`options ${property?.name}`"
            @click="onClickPropertyContextAction($event, propertyId)"
          />
        </template>
      </DatabasePropertyList>

      <div class="db-properties-sheet__actions">
        <MDButton
          label="add property"
          @click="isShowAddProperty = !isShowAddProperty"
        >
          <template #icon>
            <MDSymbol name="contextual_token_add" />
          </template>
        </MDButton>
      </div>
    </MDBottomSheetSection>

    <DatabasePropertyRemoveDialog
      v-if="removePropertyId"
      :show="!!removePropertyId"
      :path="directoryPath"
      :document-id="documentId"
      :property-id="removePropertyId"
      @apply="removePropertyId = undefined"
      @cancel="removePropertyId = undefined"
    />

    <DatabasePropertyEditDialog
      v-if="editPropertyId"
      :path="directoryPath"
      :document-id="documentId"
      :property-id="editPropertyId"
      :show="!!editPropertyId"
      @edited="editPropertyId = undefined"
      @cancel="editPropertyId = undefined"
    >
      <template #after="{ property, onUpdateProperty, onUpdateDefaultValue }">
        <!-- // TODO: это секция уникальных настроек свойств, используется в создании и редактировании, объединить в общий виджет? -->
        <DatabaseRelationPropertyEditSection
          v-if="zodIs(property, zodRelationProperty)"
          :property="property"
          :directory-path="directoryPath"
          @update:property="onUpdateProperty"
        />

        <DatabaseBooleanPropertyEditSection
          v-else-if="zodIs(property, zodBooleanProperty)"
          :property="property"
          @update:property="onUpdateProperty"
        />

        <!-- fixme: подготовить ValueField для отображения default значения -->
        <ValueField
          :document-id="documentId"
          :property-id="editPropertyId"
          :value="property.default"
          :directory-path="directoryPath"
          @update:value="onUpdateDefaultValue"
          @update:property="onUpdateProperty"
        />
      </template>
    </DatabasePropertyEditDialog>

    <PropertyCreateDialogWidget
      v-model:show="isShowAddProperty"
      :document-id="documentId"
      :directory-path="directoryPath"
    />
  </MDBottomSheet>
</template>

<style lang="css" scoped>
.db-properties-sheet {
  &__section {
    display: flex;
    flex-direction: column;
    gap: 4step;
    padding: 0 4step 4step;
  }

  &__property-list {
    &:empty {
      display: none;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 2step;
  }
}
</style>
