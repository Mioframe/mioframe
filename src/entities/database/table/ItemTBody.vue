<script setup lang="ts">
import { computed } from 'vue';
import type { DatabaseData } from '../../../shared/lib/databaseDocument/types';
import ItemTR from './ItemTR.vue';
import { isNil, pickBy } from 'lodash-es';
import type { PropertiesMap } from '../../../shared/lib/databaseDocument';

const props = defineProps<{
  data: DatabaseData;
  properties: PropertiesMap;
}>();

const filteredData = computed(() => pickBy(props.data, (v) => !isNil(v)));
</script>

<template>
  <tbody>
    <ItemTR
      v-for="(item, itemId) in filteredData"
      :key="itemId"
      :properties
      :item="item"
    />
  </tbody>
</template>
