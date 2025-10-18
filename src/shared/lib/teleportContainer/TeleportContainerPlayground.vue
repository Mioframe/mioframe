<script setup lang="ts">
import { MDPaneContainer } from '@shared/ui/Layout';
import { PlaygroundStory } from '../playground';
import TestTeleportedComponent from './TestTeleportedComponent.vue';
</script>

<template>
  <PlaygroundStory>
    <template #space>
      <MDPaneContainer>
        <div class="a">
          <div class="b">
            <TestTeleportedComponent />
          </div>
        </div>
      </MDPaneContainer>
    </template>
  </PlaygroundStory>
</template>
