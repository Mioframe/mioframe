<script setup lang="ts" generic="T extends NavigationButton">
import type { NavigationButton } from '../types';
import MDNavigationBarButton from './MDNavigationBarButton.vue';
import { BAR_TYPE } from './types';

withDefaults(
  defineProps<{
    buttons: T[];
    active?: T;
    type?: BAR_TYPE;
  }>(),
  { type: BAR_TYPE.vertical },
);

const emit = defineEmits<{
  click: [button: T];
}>();

const onClick = (button: T) => {
  emit('click', button);
};
</script>

<template>
  <div class="md-navigation-bar md" :class="[`_type-${type}`]">
    <MDNavigationBarButton
      v-for="(button, index) in buttons"
      :key="index"
      :label="button.label"
      :symbol="button.symbol"
      :active="active === button"
      class="md-navigation-bar__button"
      :type="type"
      @click="onClick(button)"
    />
  </div>
</template>

<style lang="css" scoped>
.md-navigation-bar {
  display: flex;

  &__button {
    flex-grow: 1;
  }

  &._type {
    &-horizontal {
      justify-content: center;
      gap: 16dp;
      padding: 12px 0;

      .md-navigation-bar__button {
        flex-grow: unset;
      }
    }
  }
}
</style>
