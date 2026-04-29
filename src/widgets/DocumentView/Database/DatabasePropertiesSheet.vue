<script setup lang="ts">
import { DatabasePropertyList } from '@entity/databaseProperty';
import { DatabasePropertyRemoveDialog } from '@feature/databasePropertyRemove';
import { DatabasePropertyEditDialog } from '@feature/databasePropertyEdit';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { ref } from 'vue';
import DatabasePropertySettingsSection from './DatabasePropertySettingsSection.vue';
import DatabasePropertyValueField from './DatabasePropertyValueField.vue';
import PropertyCreateDialogWidget from './PropertyCreateDialogWidget.vue';

defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const emit = defineEmits<{
  closed: [];
}>();

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

const onClosed = () => {
  emit('closed');
};

const isShowAddProperty = ref(false);

const onToggleCreateProperty = () => {
  isShowAddProperty.value = !isShowAddProperty.value;
};

const onCloseRemovePropertyDialog = () => {
  removePropertyId.value = undefined;
};

const onCloseEditPropertyDialog = () => {
  editPropertyId.value = undefined;
};

const onCreatedProperty = () => {
  isShowAddProperty.value = false;
};

const onCancelCreateProperty = () => {
  isShowAddProperty.value = false;
};
</script>

<template>
  <MDBottomSheet class="db-properties-sheet" label="Database Properties Sheet" @closed="onClosed">
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
            @click="(payload) => onClickPropertyContextAction(payload, propertyId)"
          />
        </template>
      </DatabasePropertyList>

      <div class="db-properties-sheet__actions">
        <MDButton label="add property" @click="onToggleCreateProperty">
          <template #icon>
            <MDSymbol name="contextual_token_add" />
          </template>
        </MDButton>
      </div>
    </MDBottomSheetSection>

    <DatabasePropertyRemoveDialog
      v-if="removePropertyId"
      :path="directoryPath"
      :document-id="documentId"
      :property-id="removePropertyId"
      @removed="onCloseRemovePropertyDialog"
      @cancel="onCloseRemovePropertyDialog"
    />

    <DatabasePropertyEditDialog
      v-if="editPropertyId"
      :path="directoryPath"
      :document-id="documentId"
      :property-id="editPropertyId"
      @edited="onCloseEditPropertyDialog"
      @cancel="onCloseEditPropertyDialog"
    >
      <template #after="{ property, onUpdateProperty, onUpdateDefaultValue }">
        <DatabasePropertySettingsSection
          :property="property"
          :directory-path="directoryPath"
          @update:property="onUpdateProperty"
        />

        <DatabasePropertyValueField
          :value="property.default"
          label="Default value"
          :property="property"
          :directory-path="directoryPath"
          @update:value="onUpdateDefaultValue"
          @update:property="onUpdateProperty"
        />
      </template>
    </DatabasePropertyEditDialog>

    <PropertyCreateDialogWidget
      v-if="isShowAddProperty"
      :document-id="documentId"
      :directory-path="directoryPath"
      @created="onCreatedProperty"
      @cancel="onCancelCreateProperty"
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
