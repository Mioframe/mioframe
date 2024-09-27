<script setup lang="ts">
import type { DataBaseStateLatest } from '../../shared/lib/databaseDocument';
import DatabaseTable from './table/DatabaseTable.vue';

defineProps<{
  databaseState: DataBaseStateLatest;
}>();
</script>

<template>
  <section>
    <DatabaseTable :database-state />
  </section>
</template>
