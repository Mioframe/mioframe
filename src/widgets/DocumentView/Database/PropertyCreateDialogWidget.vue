<script setup lang="ts">
import { zodRelationProperty } from '@entity/databaseRelation';
import { DatabasePropertyCreationDialog } from '@feature/databasePropertyCreate';
import { DatabaseRelationPropertyEditSection } from '@feature/databaseRelationPropertyEdit';
import type { AMDocumentId } from '@shared/lib/automerge';
import { zodBooleanProperty } from '@entity/databaseBoolean';
import { DatabaseBooleanPropertyEditSection } from '@feature/databaseBooleanPropertyEdit';
import { zodIs } from '@shared/lib/validateZodScheme';
import { extend, optional } from 'zod/v4-mini';
import { zodRelation } from '@entity/databaseRelation/model';

defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
}>();

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const zodPartialRelation = extend(zodRelationProperty, {
  relation: optional(zodRelation),
});
</script>

<template>
  <DatabasePropertyCreationDialog
    :path="directoryPath"
    :document-id="documentId"
    @created="emit('created')"
    @cancel="emit('cancel')"
  >
    <template #after="{ property, onUpdateProperty }">
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

      <!-- fixme: подготовить для создания default field -->
      <!--
        <ValueField
        :document-id="documentId"
        :property="{ ...property, name: 'default value' }"
        :value="property.default"
        :directory-path="directoryPath"
        @update:value="onUpdateDefaultValue"
        @update:property="onUpdateProperty"
        >
        <template #unknownProperty> <div /> </template>
        </ValueField> 
      -->
    </template>
  </DatabasePropertyCreationDialog>
</template>
