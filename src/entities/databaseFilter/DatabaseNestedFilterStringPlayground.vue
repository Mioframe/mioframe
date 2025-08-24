<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import DatabaseNestedFilterString from './DatabaseNestedFilterString.vue';
import PlaygroundJson from '@shared/lib/playground/ui/PlaygroundJson.vue';
import { useQueryValue } from '@shared/lib/useQueryState';
import { Repo } from '@automerge/automerge-repo';
import type { UnknownRecord } from 'type-fest';

const state = useQueryValue('state', { condition: {} });

const repo = new Repo();

const docHandle = repo.create<UnknownRecord>();
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundJson v-model="state.condition" label="condition" />
    </template>

    <template #space>
      <div class="md md-padding-2">
        <DatabaseNestedFilterString
          :condition="state.condition"
          :doc-handle="docHandle"
        />
      </div>
    </template>
  </PlaygroundStory>
</template>
