<script setup lang="ts">
import { computed, shallowRef, toRefs, useTemplateRef, watchEffect } from 'vue';
import { MDSymbol } from '../Icon';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { useInjectFocusRegister } from './focusProvider';
import MDMenuBase from './MDMenuBase.vue';

const showSubmenuModel = defineModel<boolean | undefined>('showSubmenu');

const props = withDefaults(
  defineProps<{
    label: string;
    itemRole?: string | undefined;
    /**
     * name from https://fonts.google.com/icons
     */
    symbolName?: string | undefined;
  }>(),
  {},
);

const emit = defineEmits<{
  click: [];
}>();

const slots = defineSlots<{
  submenu: () => unknown;
}>();

const { label } = toRefs(props);

const menuItemEl = useTemplateRef<HTMLElement>('menuItemEl');

const showSubmenu = shallowRef(false);

watchEffect(() => {
  showSubmenuModel.value = showSubmenu.value;
});

const onClickItem = () => {
  showSubmenu.value = !showSubmenu.value;
  emit('click');
};

const { hover, focused, durationPressedState } = useStateLayer(menuItemEl, {});
useRipple(menuItemEl);

const focus = computed(() =>
  menuItemEl.value
    ? () => {
        menuItemEl.value?.focus();
      }
    : undefined,
);

useInjectFocusRegister(label, focus);
</script>

<template>
  <button
    ref="menuItemEl"
    type="button"
    class="md-menu-item-base"
    :role="itemRole ?? undefined"
    @click="onClickItem"
  >
    <MDStateLayer :hover="hover" :focused="focused" :pressed="durationPressedState" />

    <span v-if="symbolName" class="md-menu-item-base__leading">
      <MDSymbol :name="symbolName" />
    </span>

    <span class="md-menu-item-base__label">{{ label }}</span>

    <span v-if="!!slots.submenu" class="md-menu-item-base__trailing">
      <MDSymbol name="arrow_right" />
    </span>
  </button>

  <MDMenuBase
    v-if="slots.submenu"
    v-model:show="showSubmenu"
    :target="menuItemEl"
    disabled-teleport
    placement="right-start"
  >
    <slot name="submenu" />
  </MDMenuBase>
</template>

<style scoped>
.md-menu-item-base {
  --md-content-color: var(--md-sys-color-on-surface);

  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding-inline: 12dp;
  gap: 12dp;
  border: 0;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-body-large-font);
  font-size: var(--md-sys-typescale-body-large-size);
  font-weight: var(--md-sys-typescale-body-large-weight);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  text-align: start;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;

  &__leading,
  &__trailing {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__label {
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
