<script setup lang="ts">
import { BooleanInline, zodBooleanProperty } from '@entity/databaseBoolean';
import { DateValueInline, zodDateProperty } from '@entity/databaseDate';
import { NumberValueInline, zodNumberProperty } from '@entity/databaseNumber';
import type { ParentRelation } from '@entity/databaseRelation';
import { RelationValueInline, zodRelationProperty } from '@entity/databaseRelation';
import { StringValueInline, zodStringProperty } from '@entity/databaseString';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import ValueInline from './ValueInline.vue';

defineOptions({
  name: 'DatabasePropertyValueInline',
});

withDefaults(
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

  <RelationValueInline
    v-else-if="zodIs(property, zodRelationProperty)"
    :value="value"
    :property="property"
    :directory-path="directoryPath"
    :property-id="propertyId"
    :parent-relation="parentRelation"
    @click="onClick"
  >
    <template
      #default="{
        relationDocumentId: relationDocHandle,
        relationDirectoryPath: relationDirectory,
        viewId,
        value: relationValue,
        parentRelation: relationParentRelation,
      }"
    >
      <DatabaseViewLayout
        :document-id="relationDocHandle"
        :path="relationDirectory"
        :view-id="viewId"
        :item-id-query="{ $in: relationValue }"
      >
        <template #value="{ propertyId: relationPropertyId, itemId: relationItemId }">
          <ValueInline
            :item-id="relationItemId"
            :document-id="relationDocHandle"
            :directory-path="relationDirectory"
            :property-id="relationPropertyId"
            :parent-relation="relationParentRelation"
          />
        </template>
      </DatabaseViewLayout>
    </template>
  </RelationValueInline>

  <span v-else>Unsupported property type "{{ property.type }}"</span>
</template>
