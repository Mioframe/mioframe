<script setup lang="ts">
import type {
  PropertiesMap,
  PropertyId,
} from '@shared/lib/databaseDocument/migrations/versions/v1/property';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useSortable } from '@vueuse/integrations/useSortable';
import { shallowRef, useTemplateRef, watchEffect } from 'vue';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const el = useTemplateRef('container');
const list = shallowRef<PropertyId[]>([]);

const propertiesCollection = useWrapStrictRecord(() => properties);

watchEffect(() => {
  list.value = Array.from(propertiesCollection.value.keys());
});

useSortable(el, list, {
  animation: 150,
});

// TODO: в этом нет необходимости, т.к. сортировка свойств есть только в таблице, мб лучше применить её сразу на столбцах?

// TODO: но нужна сортировка по значением и там понадобится приоритет, её можно сделать в таком виде общей?
</script>

<template>
  <div class="db-view-property-sort-form">
    <MDListContainer ref="container">
      <MDListItem
        v-for="[propertyId, property] in propertiesCollection"
        :key="propertyId"
        :headline="property.name"
      />
    </MDListContainer>
  </div>
</template>
