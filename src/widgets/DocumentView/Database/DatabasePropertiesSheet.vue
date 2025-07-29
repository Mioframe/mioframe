<script setup lang="ts">
import { DatabasePropertyList } from '@entity/databaseProperty';
import { DatabasePropertyCreationDialog } from '@feature/databasePropertyCreate';
import { DatabasePropertyRemoveDialog } from '@feature/databasePropertyRemove';
import { DatabasePropertyRenameDialog } from '@feature/databasePropertyRename';
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { ref, toRefs } from 'vue';
import ValueField from './ValueField.vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  directory: DirectoryFSEntry;
}>();

const { docHandle } = toRefs(props);

const show = defineModel<boolean>('show', { required: true });

enum PROPERTY_ACTION {
  remove,
  rename,
}

const propertyContextBtns = defineMenuButtonList([
  {
    label: 'Rename',
    symbolName: 'edit',
    key: PROPERTY_ACTION.rename,
  },
  {
    label: 'Remove',
    symbolName: 'delete',
    key: PROPERTY_ACTION.remove,
  },
]);

const removePropertyId = ref<DatabasePropertyId>();

const renamePropertyId = ref<DatabasePropertyId>();

const onClickPropertyContextAction = (
  { key: action }: { key: PROPERTY_ACTION },
  propertyId: DatabasePropertyId,
) => {
  switch (action) {
    case PROPERTY_ACTION.remove: {
      removePropertyId.value = propertyId;
      break;
    }
    case PROPERTY_ACTION.rename: {
      renamePropertyId.value = propertyId;
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
    class="db-properties-sheet"
    @update:collapsed="onUpdateCollapsed"
  >
    <MDBottomSheetSection class="md-padding-4" scroll-snap-align="end">
      <span :class="MD_SYS_TYPESCALE.title.small">Properties</span>

      <DatabasePropertyList :doc-handle="docHandle" class="md-margin-top-4">
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

      <!-- TODO: добавить кнопку добавления свойства -->
    </MDBottomSheetSection>

    <DatabasePropertyRemoveDialog
      v-if="removePropertyId"
      :show="!!removePropertyId"
      :doc-handle="docHandle"
      :property-id="removePropertyId"
      @apply="removePropertyId = undefined"
      @cancel="removePropertyId = undefined"
    />

    <DatabasePropertyRenameDialog
      v-if="renamePropertyId"
      :doc-handle="docHandle"
      :property-id="renamePropertyId"
      :show="!!renamePropertyId"
      @apply="renamePropertyId = undefined"
      @cancel="renamePropertyId = undefined"
    />

    <DatabasePropertyCreationDialog
      v-if="isShowAddProperty"
      v-model:show="isShowAddProperty"
      :directory="directory"
      :doc-handle="docHandle"
      @created="isShowAddProperty = false"
      @cancel="isShowAddProperty = false"
    >
      <template #defaultField="property">
        <ValueField
          :property="property"
          :value="property.default"
          :directory="directory"
          @update:value="property.onUpdateValue"
        />
      </template>
    </DatabasePropertyCreationDialog>
  </MDBottomSheet>
</template>

<style lang="css" scoped>
.db-properties-sheet {
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 2step;
    margin-top: 2step;
  }
}
</style>
