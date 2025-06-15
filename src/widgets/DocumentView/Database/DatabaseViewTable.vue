<script setup lang="ts">
import { useOrderedDatabaseData } from '@entity/databaseData';
import type { AMDocHandle } from '@shared/lib/cfrDocument';
import type {
  DatabaseData,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseValue,
  DatabaseViewId,
} from '@shared/lib/databaseDocument/state';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { MDTable } from '@shared/ui/Table';
import EditableInlineValue from '@widget/DocumentView/Database/EditableInlineValue.vue';
import { toRefs } from 'vue';

const { docHandle, viewId, properties } =
  toRefs(
    defineProps<{
      properties: DatabaseUnknownPropertiesMap;
      data: DatabaseData;

      docHandle: AMDocHandle;
      viewId?: DatabaseViewId;
    }>(),
  );

const propertiesCollection = useWrapStrictRecord(properties);

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

// TODO: переделать в Entity

const { itemList } = useOrderedDatabaseData(docHandle, viewId);
</script>

<template>
  <MDTable>
    <thead>
      <tr>
        <th
          v-for="[propertyId, { name }] in propertiesCollection"
          :key="propertyId"
        >
          {{ name }}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="[itemId, item] in itemList" :key="itemId">
        <td
          v-for="[propertyId, property] in propertiesCollection"
          :key="propertyId"
        >
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
