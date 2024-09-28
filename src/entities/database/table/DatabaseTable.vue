<script setup lang="ts">
import { computed } from 'vue';
import type { DataBaseStateLatest } from '../../../shared/lib/databaseDocument';
import ItemTBody from './ItemTBody.vue';
import PropertyTHead from './PropertyTHead.vue';

const props = defineProps<{
  databaseState: DataBaseStateLatest;
}>();

const properties = computed(() => props.databaseState.properties);

const data = computed(() => props.databaseState.data);
</script>

<template>
  <table class="table">
    <PropertyTHead :properties />

    <ItemTBody :data="data" :properties />
  </table>
</template>
