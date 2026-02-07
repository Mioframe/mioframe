<script setup lang="ts">
import { MDPane } from '@shared/ui/Layout';
import { PlaygroundStory } from '../playground';
import TestTeleportedComponent from './TestTeleportedComponent.vue';
</script>

<template>
  <PlaygroundStory>
    <template #space>
      <MDPane>
        <div class="a">
          <div class="b">
            <TestTeleportedComponent />
          </div>
        </div>
      </MDPane>
    </template>
  </PlaygroundStory>
</template>
