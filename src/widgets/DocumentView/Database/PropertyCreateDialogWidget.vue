<script setup lang="ts">
import { DatabasePropertyCreationDialog } from '@feature/databasePropertyCreate';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import DatabasePropertySettingsSection from './DatabasePropertySettingsSection.vue';
import DatabasePropertyValueField from './DatabasePropertyValueField.vue';

defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
}>();

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const DEFAULT_VALUE_LABEL = 'Default value';

const onCreated = () => {
  emit('created');
};

const onCancel = () => {
  emit('cancel');
};

const getDefaultValueProperty = (property: DatabaseUnknownProperty): DatabaseUnknownProperty => ({
  ...property,
  name: DEFAULT_VALUE_LABEL,
});

const getUpdatedDefaultValueProperty = (
  property: DatabaseUnknownProperty,
  updatedProperty: DatabaseUnknownProperty,
): DatabaseUnknownProperty => ({
  ...updatedProperty,
  name: property.name,
});
</script>

<template>
  <DatabasePropertyCreationDialog
    :path="directoryPath"
    :document-id="documentId"
    @created="onCreated"
    @cancel="onCancel"
  >
    <template #after="{ property, onUpdateDefaultValue, onUpdateProperty }">
      <DatabasePropertySettingsSection
        :property="property"
        :directory-path="directoryPath"
        @update:property="onUpdateProperty"
      />

      <DatabasePropertyValueField
        :value="property.default"
        :property="getDefaultValueProperty(property)"
        :directory-path="directoryPath"
        @update:value="onUpdateDefaultValue"
        @update:property="
          (updatedProperty) =>
            onUpdateProperty(getUpdatedDefaultValueProperty(property, updatedProperty))
        "
      />
    </template>
  </DatabasePropertyCreationDialog>
</template>
