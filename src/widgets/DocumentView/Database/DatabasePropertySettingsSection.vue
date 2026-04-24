<script setup lang="ts">
import { BooleanPropertySettingsSection, zodBooleanProperty } from '@entity/databaseBoolean';
import { zodRelationProperty } from '@entity/databaseRelation';
import { DatabaseRelationPropertyEditSection } from '@feature/databaseRelationPropertyEdit';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';

defineProps<{
  property: DatabaseUnknownProperty;
  directoryPath: string;
}>();

const emit = defineEmits<{
  'update:property': [property: DatabaseUnknownProperty];
}>();

const onUpdateProperty = (property: DatabaseUnknownProperty) => {
  emit('update:property', property);
};
</script>

<template>
  <DatabaseRelationPropertyEditSection
    v-if="zodIs(property, zodRelationProperty)"
    :property="property"
    :directory-path="directoryPath"
    @update:property="onUpdateProperty"
  />

  <BooleanPropertySettingsSection
    v-else-if="zodIs(property, zodBooleanProperty)"
    :property="property"
    @update:property="onUpdateProperty"
  />
</template>
