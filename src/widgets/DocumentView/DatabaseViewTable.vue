<script setup lang="ts">
import { DatabaseValueSpan } from '@entity/databaseValue';
import type { DatabaseData } from '@shared/lib/databaseDocument';
import type { PropertiesMap } from '@shared/lib/databaseDocument/property';
import { MDTable } from '@shared/ui/Table';

const { data } = defineProps<{
  properties: PropertiesMap;
  data: DatabaseData;
}>();
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
          <DatabaseValueSpan :item :property-id :property />
        </td>
      </tr>
    </tbody>
  </MDTable>
</template>
