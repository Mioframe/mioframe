<script setup lang="ts">
import { DatabasePropertyList } from '@entity/databaseProperty';
import { DatabasePropertyRemoveDialog } from '@feature/databasePropertyRemove';
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { ref, toRefs } from 'vue';
import PropertyCreateDialogWidget from './PropertyCreateDialogWidget.vue';
import { DatabasePropertyEditDialog } from '@feature/databasePropertyEdit';
import { DatabaseRelationPropertyEditSection } from '@feature/databaseRelationPropertyEdit';
import { zodIs } from '@shared/lib/validateZodScheme';
import { zodRelationProperty } from '@entity/databaseRelation';
import { DatabaseBooleanPropertyEditSection } from '@feature/databaseBooleanPropertyEdit';
import { zodBooleanProperty } from '@entity/databaseBoolean';
import ValueField from './ValueField.vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  directory: DirectoryFSEntry;
}>();

const { docHandle } = toRefs(props);

const show = defineModel<boolean>('show', { required: true });

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
    show.value = false;
  }
};

const isShowAddProperty = ref(false);
</script>

<template>
  <MDBottomSheet
    :show="show"
    :collapsed="false"
    type="modal"
    class="db-properties-sheet"
    @update:collapsed="onUpdateCollapsed"
    @click-container="show = false"
  >
    <MDBottomSheetSection
      class="db-properties-sheet__section"
      scroll-snap-align="end"
    >
      <span :class="MD_SYS_TYPESCALE.title.small">Properties</span>

      <DatabasePropertyList
        class="db-properties-sheet__property-list"
        :doc-handle="docHandle"
      >
        <template #trailingIcon="{ propertyId }">
          <MDContextMenuButton
            :btns="propertyContextBtns"
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
      :doc-handle="docHandle"
      :property-id="removePropertyId"
      @apply="removePropertyId = undefined"
      @cancel="removePropertyId = undefined"
    />

    <DatabasePropertyEditDialog
      v-if="editPropertyId"
      :doc-handle="docHandle"
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
          :directory="directory"
          @update:property="onUpdateProperty"
        />

        <DatabaseBooleanPropertyEditSection
          v-else-if="zodIs(property, zodBooleanProperty)"
          :property="property"
          @update:property="onUpdateProperty"
        />

        <ValueField
          :property="property"
          :value="property.default"
          :directory="directory"
          @update:value="onUpdateDefaultValue"
          @update:property="onUpdateProperty"
        />
      </template>
    </DatabasePropertyEditDialog>

    <PropertyCreateDialogWidget
      v-if="isShowAddProperty"
      v-model:show="isShowAddProperty"
      :doc-handle="docHandle"
      :directory="directory"
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
