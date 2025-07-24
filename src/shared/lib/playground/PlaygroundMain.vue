<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useRoute } from 'vue-router';
import PlaygroundNavigation from './PlaygroundNavigation.vue';
import { computed } from 'vue';
import type {
  PlaygroundNavigationDescription,
  PlaygroundRouteRecordRaw,
} from './types';

const route = useRoute();

const playgroundRoutes = computed(
  () => <PlaygroundRouteRecordRaw[] | undefined>route.meta.playgroundRoutes,
);

const routeToNavigation = ({
  name: routeName,
  meta: { name },
  children,
}: PlaygroundRouteRecordRaw): PlaygroundNavigationDescription => ({
  name,
  routeName,
  children: children?.map(routeToNavigation),
});

const navigation = computed(() =>
  playgroundRoutes.value?.map(routeToNavigation),
);
</script>

<template>
  <div class="playground md">
    <PlaygroundNavigation
      v-if="navigation"
      class="playground__navigation"
      :navigation="navigation"
    />

    <div class="playground__main">
      <RouterView />
    </div>
  </div>
</template>

<style lang="css" scoped>
.playground {
  display: flex;
  min-height: 100dvh;
  width: 100dvw;

  &__navigation {
    overflow-y: auto;
    padding: 8px;
    margin: 0;
  }

  &__main {
    display: flex;
    padding: 8px;
    flex: 1 1;
    overflow: auto;
  }
}
</style>
