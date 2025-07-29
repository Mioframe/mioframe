<script setup lang="ts">
import { zodRelationProperty } from '@entity/databaseRelation';
import { DatabasePropertyCreationDialog } from '@feature/databasePropertyCreate';
import { DatabaseRelationPropertyEditSection } from '@feature/databaseRelationPropertyEdit';
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import ValueField from './ValueField.vue';
import { zodBooleanProperty } from '@entity/databaseBoolean';
import { DatabaseBooleanPropertyEditSection } from '@feature/databaseBooleanPropertyEdit';
import { zodIs } from '@shared/lib/validateZodScheme';

defineProps<{
  docHandle: AMDocHandle;
  directory: DirectoryFSEntry;
}>();

const show = defineModel<boolean>('show', { required: true });
</script>

<template>
  <DatabasePropertyCreationDialog
    v-model:show="show"
    :doc-handle="docHandle"
    @created="show = false"
    @cancel="show = false"
  >
    <template #after="{ property, onUpdateProperty, onUpdateDefaultValue }">
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
        :property="{ ...property, name: 'default value' }"
        :value="property.default"
        :directory="directory"
        @update:value="onUpdateDefaultValue"
      />
    </template>
  </DatabasePropertyCreationDialog>
</template>
