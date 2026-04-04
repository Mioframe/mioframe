<script setup lang="ts">
import { useStackNavigation } from '@page/routes';
import { MDSplitLayout } from '@shared/ui/Layout';
import {
  defineNavigationButton,
  type NavigationButton,
} from '@shared/ui/Navigation';
import { computed } from 'vue';

const homeNavigationButton = defineNavigationButton({
  label: 'Home',
  symbol: 'home',
});

const settingsNavigationButton = defineNavigationButton({
  label: 'Settings',
  symbol: 'settings',
});

const { open, back } = useStackNavigation();

const onClickNavigation = async (button: NavigationButton) => {
  switch (button) {
    case homeNavigationButton: {
      await open('home', {}, { replace: true, additionalPanes: 0 });
      break;
    }
    case settingsNavigationButton: {
      await open('settings', {}, { replace: false, additionalPanes: 0 });
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

const onClickBack = () => {
  back();
};
</script>

<template>
  <MDSplitLayout
    class="main-view"
    :navigation-buttons="[homeNavigationButton, settingsNavigationButton]"
    has-menu-button
    :active-navigation-button="activeNavigationButton"
    :panes="panes"
    @click-navigation="onClickNavigation"
    @click-back="onClickBack"
  />
</template>
