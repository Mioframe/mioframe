<script setup lang="ts">
import { zodRelationProperty } from '@entity/databaseRelation';
import { DatabasePropertyCreationDialog } from '@feature/databasePropertyCreate';
import { DatabaseRelationPropertyEditSection } from '@feature/databaseRelationPropertyEdit';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { EntryPath } from '@shared/lib/fileSystem';
import ValueField from './ValueField.vue';
import { zodBooleanProperty } from '@entity/databaseBoolean';
import { DatabaseBooleanPropertyEditSection } from '@feature/databaseBooleanPropertyEdit';
import { zodIs } from '@shared/lib/validateZodScheme';
import { extend, optional } from 'zod/v4-mini';
import { zodRelation } from '@entity/databaseRelation/model';

defineProps<{
  documentId: AMDocumentId;
  directoryPath: EntryPath;
}>();

const showModel = defineModel<boolean>('show', { required: true });

const zodPartialRelation = extend(zodRelationProperty, {
  relation: optional(zodRelation),
});
</script>

<template>
  <DatabasePropertyCreationDialog
    v-model:show="showModel"
    :directory-path="directoryPath"
    :document-id="documentId"
    @created="showModel = false"
    @cancel="showModel = false"
  >
    <template #after="{ property, onUpdateProperty, onUpdateDefaultValue }">
      <DatabaseRelationPropertyEditSection
        v-if="zodIs(property, zodPartialRelation)"
        :property="property"
        :directory-path="directoryPath"
        @update:property="onUpdateProperty"
      />

      <DatabaseBooleanPropertyEditSection
        v-else-if="zodIs(property, zodBooleanProperty)"
        :property="property"
        @update:property="onUpdateProperty"
      />

      <ValueField
        :property="{ ...property, name: 'default value' }"
        :value="property.default"
        :directory-path="directoryPath"
        @update:value="onUpdateDefaultValue"
        @update:property="onUpdateProperty"
      >
        <template #unknownProperty> <div /> </template>
      </ValueField>
    </template>
  </DatabasePropertyCreationDialog>
</template>
