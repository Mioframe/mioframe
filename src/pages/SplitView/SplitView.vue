<script setup lang="ts">
import { MDIconButton } from '@shared/ui/Button';
import { MDSplitLayer, SPLIT_VIEW } from '@shared/ui/Layers';
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

const router = useRouter();

const onClickBack = () => {
  router.back();
};

const route = useRoute();

const hasSecondView = computed(() => {
  const components = route.matched.at(-1)?.components;

  if (components) {
    return SPLIT_VIEW.second in components;
  }

  return false;
});
</script>

<template>
  <MDSplitLayer class="main-view">
    <template #[SPLIT_VIEW.second]>
      <RouterView v-slot="{ Component }" :name="SPLIT_VIEW.second">
        <component :is="Component">
          <template #navigationButton>
            <MDIconButton tooltip="menu" md-symbol-name="menu" />
          </template>
        </component>
      </RouterView>
    </template>

    <template #[SPLIT_VIEW.main]>
      <RouterView v-slot="{ Component }" :name="SPLIT_VIEW.main">
        <component :is="Component">
          <template #navigationButton>
            <MDIconButton
              v-if="hasSecondView"
              tooltip="back"
              md-symbol-name="arrow_back"
              @click="onClickBack"
            />

            <MDIconButton v-else tooltip="menu" md-symbol-name="menu" />
          </template>
        </component>
      </RouterView>
    </template>
  </MDSplitLayer>
</template>
