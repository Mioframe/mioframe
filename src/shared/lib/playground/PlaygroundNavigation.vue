<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { PlaygroundNavigationDescription } from './types';

const {} = defineProps<{
  navigation: PlaygroundNavigationDescription[];
}>();
</script>

<template>
  <ul class="navigation">
    <li v-for="{ routeName, name, children } in navigation" :key="name">
      <RouterLink
        :to="{
          name: routeName,
        }"
      >
        {{ name }}
      </RouterLink>

      <PlaygroundNavigation v-if="children" :navigation="children" />
    </li>
  </ul>
</template>
