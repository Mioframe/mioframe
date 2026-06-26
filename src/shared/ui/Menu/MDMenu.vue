<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import type { MaybeElement } from '@vueuse/core';
import { computed, toRefs } from 'vue';
import type { MenuButtonDescription, NonEmptyMenuButtonList } from './types';
import MDMenuItem from './MDMenuItem.vue';
import MDMenuBase from './MDMenuBase.vue';

const showModel = defineModel<boolean>('show', { required: true });

const props = withDefaults(
  defineProps<{
    target: MaybeElement;
    btns: NonEmptyMenuButtonList<T>;
    outsideIgnore?: MaybeElement[] | undefined;
    disabledTeleport?: boolean | undefined;
    placement?: 'bottom-start' | 'right-start' | undefined;
    ariaLabel?: string | undefined;
    role?: string | undefined;
  }>(),
  {
    placement: 'bottom-start',
    role: 'menu',
  },
);

const emit = defineEmits<{
  click: [menuItem: T];
  interactionOutside: [];
  deactivateFocus: [];
}>();

const { target, btns, outsideIgnore, placement } = toRefs(props);

const onClickItem = (menuItem: T) => {
  emit('click', menuItem);
};

const itemRole = computed(() => (props.role === 'listbox' ? 'option' : undefined));

const onMenuDeactivateFocus = () => {
  emit('deactivateFocus');
};

const onMenuInteractionOutside = () => {
  emit('interactionOutside');
};
</script>

<template>
  <MDMenuBase
    v-model:show="showModel"
    :target="target"
    :outside-ignore="outsideIgnore"
    :disabled-teleport="disabledTeleport"
    :placement="placement"
    :aria-label="ariaLabel"
    :role="role"
    @deactivate-focus="onMenuDeactivateFocus"
    @interaction-outside="onMenuInteractionOutside"
  >
    <MDMenuItem
      v-for="item in btns"
      :key="item.key"
      :item="item"
      :item-role="itemRole"
      @click="onClickItem"
    />
  </MDMenuBase>
</template>
