<script setup lang="ts">
import { computed } from 'vue';
import type { DataBaseStateLatest } from '../../../shared/lib/databaseDocument';
import ItemTBody from './ItemTBody.vue';
import PropertyTHead from './PropertyTHead.vue';

const props = defineProps<{
  databaseState: DataBaseStateLatest;
}>();

const properties = computed(() => props.databaseState.properties);
</script>

<template>
  <table class="table">
    <PropertyTHead :properies="properties" />

    <ItemTBody />
  </table>
</template>
