<script setup lang="ts">
import { useMainRouter, useStackNavigation } from '@page/routes';
import { MDSplitLayout } from '@shared/ui/Layout';
import type { NavigationButton } from '@shared/ui/Navigation';
import { defineNavigationButton } from '@shared/ui/Navigation';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const onClickBack = () => {
  router.back();
};

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

const activePane = computed(() => panes.value.at(0)?.name);

const activeNavigationButton = computed(() => {
  switch (activePane.value) {
    case 'home':
      return homeNavigationButton;
    case 'settings':
      return settingsNavigationButton;

    default:
      return undefined;
  }
});

const { panesComponents: panes } = useStackNavigation();
</script>

<template>
  <MDSplitLayout
    :number-of-panes="panes.length"
    class="main-view"
    :navigation-buttons="[homeNavigationButton, settingsNavigationButton]"
    has-menu-button
    :active-navigation-button="activeNavigationButton"
    :panes="panes"
    @click-navigation="onClickNavigation"
    @click-back="onClickBack"
  />
</template>
