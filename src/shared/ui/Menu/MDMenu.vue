<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import type { MaybeElement } from '@vueuse/core';
import { computed, ref, toRefs } from 'vue';
import type { MenuButtonDescription, MenuButtonList } from './types';
import MDMenuItem from './MDMenuItem.vue';
import MDMenuBase from './MDMenuBase.vue';

const props = withDefaults(
  defineProps<{
    target: MaybeElement;
    btns?: MenuButtonList<T> | undefined;
    transition?: boolean | undefined;
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

const { target, btns, outsideIgnore, placement } = toRefs(props);

const emit = defineEmits<{
  click: [menuItem: T];
  interactionOutside: [];
  deactivateFocus: [];
}>();

const showModel = defineModel<boolean>('show', { required: true });

const onClickItem = (menuItem: T) => {
  emit('click', menuItem);
};

const showSubmenu = ref<boolean | undefined>();
const itemRole = computed(() => (props.role === 'listbox' ? 'option' : undefined));
</script>

<template>
  <MDMenuBase
    v-model:show="showModel"
    :target="target"
    :transition="transition"
    :outside-ignore="outsideIgnore"
    :disabled-teleport="disabledTeleport"
    :placement="placement"
    :aria-label="ariaLabel"
    :role="role"
    @deactivate-focus="emit('deactivateFocus')"
    @interaction-outside="emit('interactionOutside')"
  >
    <MDMenuItem
      v-for="item in btns"
      :key="item.key"
      :item="item"
      :item-role="itemRole"
      @click="onClickItem"
      @update:show-submenu="showSubmenu = $event"
    />
  </MDMenuBase>
</template>
