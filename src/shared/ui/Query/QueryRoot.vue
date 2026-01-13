<script setup lang="ts">
import type { UnknownRecord } from 'type-fest';
import QueryObject from './QueryObject.vue';

defineProps<{
  query: UnknownRecord;
}>();
</script>

<template>
  <QueryObject :query="query" />
</template>
