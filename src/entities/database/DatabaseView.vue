<script setup lang="ts">
import type { DataBaseStateLatest } from '../../shared/lib/databaseDocument';
import DatabaseTable from './table/DatabaseTable.vue';

defineProps<{
  databaseState: DataBaseStateLatest;
}>();
</script>

<template>
  <section class="is-flex">
    <DatabaseTable :database-state class="is-flex-grow-1" />
  </section>
</template>
