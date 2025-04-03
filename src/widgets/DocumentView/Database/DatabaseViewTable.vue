<script setup lang="ts">
import type { DatabaseData, ItemId } from '@shared/lib/databaseDocument';
import type { DatabaseValue } from '@shared/lib/databaseDocument/item/data';
import type {
  PropertiesMap,
  PropertyId,
} from '@shared/lib/databaseDocument/property';
import { MDTable } from '@shared/ui/Table';
import EditableInlineValue from '@widget/DocumentView/Database/EditableInlineValue.vue';

const { data } = defineProps<{
  properties: PropertiesMap;
  data: DatabaseData;
}>();

const emit = defineEmits<{
  changeValue: [itemId: ItemId, propertyId: PropertyId, value: DatabaseValue];
}>();

const onChangeValue = (
  itemId: ItemId,
  propertyId: PropertyId,
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
