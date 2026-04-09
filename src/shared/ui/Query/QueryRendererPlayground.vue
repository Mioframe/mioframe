<script setup lang="ts">
import { PlaygroundJson, PlaygroundStory } from '@shared/lib/playground';
import { isObjectLike } from '@shared/lib/typeGuards';
import QueryRoot from './QueryRoot.vue';
import { computed, ref } from 'vue';

const query = ref<unknown>({});
const isQueryObject = (value: unknown): value is Record<string, unknown> =>
  isObjectLike(value) && !Array.isArray(value);

const normalizedQuery = computed<Record<string, unknown>>(() =>
  isQueryObject(query.value) ? query.value : {},
);
</script>

<template>
  <PlaygroundStory>
    <template #space>
      <QueryRoot :query="normalizedQuery" />
    </template>

    <template #controllers>
      <PlaygroundJson v-model="query" label="query" />
    </template>
  </PlaygroundStory>
</template>
