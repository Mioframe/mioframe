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
    editable?: boolean;
    directoryPath: string;
    propertyId: DatabasePropertyId;
    parentRelation?: ParentRelation | undefined;
    tabIndex?: number;
  }>(),
  {
    tabIndex: 0,
  },
);

const emit = defineEmits<{
  click: [];
}>();

const { value, property, editable, directoryPath, propertyId, parentRelation, tabIndex } =
  toRefs(props);

const onClick = () => {
  emit('click');
};
</script>

<template>
  <span v-if="!property">Unsupported property type</span>

  <BooleanInline
    v-else-if="zodIs(property, zodBooleanProperty)"
    :value="value"
    :property="property"
    :editable="editable"
    :tab-index="tabIndex"
    @click="onClick"
  />

  <NumberValueInline
    v-else-if="zodIs(property, zodNumberProperty)"
    :value="value"
    @click="onClick"
  />

  <StringValueInline
    v-else-if="zodIs(property, zodStringProperty)"
    :value="value"
    @click="onClick"
  />

  <DateValueInline v-else-if="zodIs(property, zodDateProperty)" :value="value" @click="onClick" />

  <DatabaseRelationValueInline
    v-else-if="zodIs(property, zodRelationProperty)"
    :value="value"
    :property="property"
    :directory-path="directoryPath"
    :property-id="propertyId"
    :parent-relation="parentRelation"
    @click="onClick"
  />

  <span v-else>Unsupported property type "{{ property.type }}"</span>
</template>
