<script setup lang="ts">
import { DatabasePropertyCreationDialog } from '@feature/databasePropertyCreate';
import type { AMDocumentId } from '@shared/lib/automerge';
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

const onCreated = () => {
  emit('created');
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <DatabasePropertyCreationDialog
    :path="directoryPath"
    :document-id="documentId"
    @created="onCreated"
    @cancel="onCancel"
  >
    <template #after="{ property, submitProperty, onUpdateDefaultValue, onUpdateProperty }">
      <DatabasePropertySettingsSection
        :property="property"
        :directory-path="directoryPath"
        @update:property="onUpdateProperty"
      />

      <DatabasePropertyValueField
        v-if="submitProperty"
        :value="submitProperty.default"
        label="Default value"
        :property="submitProperty"
        :directory-path="directoryPath"
        @update:value="onUpdateDefaultValue"
        @update:property="onUpdateProperty"
      />
    </template>
  </DatabasePropertyCreationDialog>
</template>
