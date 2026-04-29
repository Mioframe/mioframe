<script setup lang="ts">
import { BooleanPropertySettingsSection, zodBooleanProperty } from '@entity/databaseBoolean';
import { isRelationDraftProperty } from '@entity/databaseRelation';
import { DatabaseRelationPropertyEditSection } from '@feature/databaseRelationPropertyEdit';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed } from 'vue';

const props = defineProps<{
  property: DatabaseUnknownProperty;
  directoryPath: string;
}>();

const emit = defineEmits<{
  'update:property': [property: DatabaseUnknownProperty];
}>();

const onUpdateProperty = (property: DatabaseUnknownProperty) => {
  emit('update:property', property);
};

const relationProperty = computed(() => {
  if (isRelationDraftProperty(props.property)) {
    return props.property;
  }

  return undefined;
});
</script>

<template>
  <DatabaseRelationPropertyEditSection
    v-if="relationProperty"
    :property="relationProperty"
    :directory-path="directoryPath"
    @update:property="onUpdateProperty"
  />

  <BooleanPropertySettingsSection
    v-else-if="zodIs(property, zodBooleanProperty)"
    :property="property"
    @update:property="onUpdateProperty"
  />
</template>
