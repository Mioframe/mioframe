<script setup lang="ts">
import type {
  PropertiesMap,
  PropertyId,
} from '@shared/lib/databaseDocument/property';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useSortable } from '@vueuse/integrations/useSortable';
import { shallowRef, useTemplateRef, watchEffect } from 'vue';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const el = useTemplateRef('container');
const list = shallowRef<PropertyId[]>([]);

watchEffect(() => {
  list.value = <(keyof typeof properties)[]>Object.keys(properties);
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
        v-for="propertyId in list"
        :key="propertyId"
        :headline="properties[propertyId].name"
      />
    </MDListContainer>
  </div>
</template>
