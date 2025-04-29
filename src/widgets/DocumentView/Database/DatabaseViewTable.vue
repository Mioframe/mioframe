<script setup lang="ts">
import type {
  DatabaseData,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseValue,
} from '@shared/lib/databaseDocument/state';
import { MDTable } from '@shared/ui/Table';
import EditableInlineValue from '@widget/DocumentView/Database/EditableInlineValue.vue';

const { data } = defineProps<{
  properties: DatabaseUnknownPropertiesMap;
  data: DatabaseData;
}>();

const emit = defineEmits<{
  changeValue: [
    itemId: DatabaseItemId,
    propertyId: DatabasePropertyId,
    value: DatabaseValue,
  ];
}>();

const onChangeValue = (
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
  value: DatabaseValue,
) => {
  emit('changeValue', itemId, propertyId, value);
};
</script>

<template>
  <MDTable>
    <thead>
      <tr>
        <th v-for="({ name }, propertyId) in properties" :key="propertyId">
          {{ name }}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="(item, itemId) in data" :key="itemId">
        <td v-for="(property, propertyId) in properties" :key="propertyId">
          <EditableInlineValue
            :item
            :property-id
            :property
            @update:value="onChangeValue(itemId, propertyId, $event)"
          />
        </td>
      </tr>
    </tbody>
  </MDTable>
</template>
