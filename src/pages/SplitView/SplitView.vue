<script setup lang="ts">
import { useMainRouter, useStackNavigation } from '@page/routes';
import { MDIconButton } from '@shared/ui/Button';
import { MDSplitLayout, SPLIT_VIEW } from '@shared/ui/Layout';
import type { NavigationButton } from '@shared/ui/Navigation';
import { defineNavigationButton } from '@shared/ui/Navigation';
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

const homeNavigationButton = defineNavigationButton({
  label: 'Home',
  symbol: 'home',
});

const settingsNavigationButton = defineNavigationButton({
  label: 'Settings',
  symbol: 'settings',
});

const { open } = useMainRouter();

const onClickNavigation = async (button: NavigationButton) => {
  switch (button) {
    case homeNavigationButton: {
      await open('home', {});
      break;
    }
    case settingsNavigationButton: {
      await open('settings', {});
      break;
    }
    default:
      break;
  }
};

const currentRoute = useRoute();

const activeNavigationButton = computed(() => {
  switch (currentRoute.name) {
    case 'home':
      return homeNavigationButton;
    case 'settings':
      return settingsNavigationButton;

    default:
      return undefined;
  }
});

const { panesComponents } = useStackNavigation();

const panes = computed(() => panesComponents.value.toReversed());
</script>

<template>
  <MDSplitLayout
    class="main-view"
    :navigation-buttons="[homeNavigationButton, settingsNavigationButton]"
    has-menu-button
    :active-navigation-button="activeNavigationButton"
    @click-navigation="onClickNavigation"
  >
    <template #body>
      <component
        :is="component"
        v-for="{ name, component, props } in panes"
        :key="name"
        :="props"
      />

      <template v-if="!panes.length">
        <RouterView v-slot="{ Component }" :name="SPLIT_VIEW.second">
          <component :is="Component" />
        </RouterView>

        <RouterView v-slot="{ Component }" :name="SPLIT_VIEW.main">
          <component :is="Component">
            <template #navigationButton>
              <MDIconButton
                v-if="hasSecondView"
                tooltip="back"
                md-symbol-name="arrow_back"
                @click="onClickBack"
              />
            </template>
          </component>
        </RouterView>
      </template>
    </template>
  </MDSplitLayout>
</template>
