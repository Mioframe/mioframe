<script setup lang="ts">
import { ref } from 'vue';
import MDList from './MDList.vue';

const list = ref(
  new Array(10).fill(0).map((_, index) => ({
    headline: `headline${index}`,
    key: index,
    supportingText: `supportingText${index}`,
  })),
);
</script>

<template>
  <Story title="List">
    <Variant title="Simple">
      <MDList :list="list" />
    </Variant>
  </Story>
</template>
