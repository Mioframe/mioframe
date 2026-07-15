<script setup lang="ts" generic="T extends NavigationButton">
import { BUTTON_TYPE } from './types';
import { RAIL_TYPE } from './types';
import MDNavigationRailButton from './MDNavigationRailButton.vue';
import { MDIconButton } from '../../Button';
import { computed } from 'vue';
import type { NavigationButton } from '../types';

const railType = defineModel<RAIL_TYPE | undefined>('type', {
  default: RAIL_TYPE.collapsed,
});

const props = defineProps<{
  buttons: T[];
  active?: T | undefined;
  hasMenu?: boolean | undefined;
}>();

const emit = defineEmits<{
  click: [button: T];
}>();

const onClick = (button: T) => {
  emit('click', button);
};

const tooltipMenuBtn = computed(() =>
  railType.value === RAIL_TYPE.collapsed ? 'expand menu' : 'collapse menu',
);

const symbolMenuBtn = computed(() =>
  railType.value === RAIL_TYPE.collapsed ? 'menu' : 'menu_open',
);

const onClickMenuBtn = () => {
  railType.value =
    railType.value === RAIL_TYPE.collapsed ? RAIL_TYPE.expanded : RAIL_TYPE.collapsed;
};

const buttonType = computed(() => {
  if (railType.value === RAIL_TYPE.expanded) {
    return BUTTON_TYPE.railHorizontal;
  }

  return BUTTON_TYPE.vertical;
});

const showMenuBtn = computed(() => props.hasMenu);
</script>

<template>
  <section class="md-navigation-rail md" :class="[`_rail-type-${railType}`]">
    <MDIconButton
      v-if="showMenuBtn"
      :tooltip="tooltipMenuBtn"
      :md-symbol-name="symbolMenuBtn"
      color="standard"
      class="md-navigation-rail__menu-button"
      @click="onClickMenuBtn"
    />

    <MDNavigationRailButton
      v-for="(button, buttonIndex) in buttons"
      :key="buttonIndex"
      class="md-navigation-rail__button"
      :symbol="button.symbol"
      :label="button.label"
      :active="active === button"
      :type="buttonType"
      :has-ripple="railType === RAIL_TYPE.expanded"
      @click="onClick(button)"
    />
  </section>
</template>

<style lang="css" scoped>
.md-navigation-rail {
  display: flex;
  flex-direction: column;
  gap: 1step;
  width: 24step;
  transition-property: none;
  padding-top: 4step;

  &__menu-button {
    align-self: center;
  }

  &__button {
    &:first-child {
      margin-top: 1step;
    }

    .md-navigation-rail__menu-button + & {
      margin-top: 44px;
    }
  }

  &._rail-type-expanded {
    gap: 0;
    width: fit-content;
    min-width: 220px;
    max-width: 360px;
    box-sizing: border-box;
    align-items: flex-start;
    padding-left: 20px;
    padding-right: 20px;

    .md-navigation-rail__menu-button {
      margin-left: 2step;
      align-self: unset;
    }

    .md-navigation-rail__button {
      width: 100%;
    }
  }
}
</style>
