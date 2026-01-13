<script setup lang="ts">
import { PlaygroundJson, PlaygroundStory } from '@shared/lib/playground';
import QueryRoot from './QueryRoot.vue';
import { ref } from 'vue';

const query = ref({});
</script>

<template>
  <PlaygroundStory>
    <template #space>
      <QueryRoot :query="query" />
    </template>

    <template #controllers>
      <PlaygroundJson v-model="query" label="query" />
    </template>
  </PlaygroundStory>
</template>
