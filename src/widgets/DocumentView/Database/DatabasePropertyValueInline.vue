<script setup lang="ts">
import { BooleanInline, zodBooleanProperty } from '@entity/databaseBoolean';
import { DateValueInline, zodDateProperty } from '@entity/databaseDate';
import { NumberValueInline, zodNumberProperty } from '@entity/databaseNumber';
import type { ParentRelation } from '@entity/databaseRelation';
import { zodRelationProperty } from '@entity/databaseRelation';
import { StringValueInline, zodStringProperty } from '@entity/databaseString';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { toRefs } from 'vue';
import DatabaseRelationValueInline from './DatabaseRelationValueInline.vue';

defineOptions({
  name: 'DatabasePropertyValueInline',
});

const props = withDefaults(
  defineProps<{
    value: unknown;
    property?: DatabaseUnknownProperty | undefined;
    directoryPath: string;
    propertyId: DatabasePropertyId;
    parentRelation?: ParentRelation | undefined;
  }>(),
  {},
);
const { value, property, directoryPath, propertyId, parentRelation } = toRefs(props);
</script>

<template>
  <span v-if="!property">Unsupported property type</span>

  <BooleanInline
    v-else-if="zodIs(property, zodBooleanProperty)"
    :value="value"
    :property="property"
  />

  <NumberValueInline v-else-if="zodIs(property, zodNumberProperty)" :value="value" />

  <StringValueInline v-else-if="zodIs(property, zodStringProperty)" :value="value" />

  <DateValueInline v-else-if="zodIs(property, zodDateProperty)" :value="value" />

  <DatabaseRelationValueInline
    v-else-if="zodIs(property, zodRelationProperty)"
    :value="value"
    :property="property"
    :directory-path="directoryPath"
    :property-id="propertyId"
    :parent-relation="parentRelation"
  />

  <span v-else>Unsupported property type "{{ property.type }}"</span>
</template>
