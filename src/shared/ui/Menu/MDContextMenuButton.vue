<script
  setup
  lang="ts"
  generic="K extends PropertyKey, T extends MenuButtonDescription"
>
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import type { MaybeElement } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';
import type { MenuButtonDescription } from './types';
import MDMenu from './MDMenu.vue';

const {} = defineProps<{
  btns: Iterable<[K, T]>;
  disabledTeleport?: boolean;
}>();

const showMenu = ref(false);

const targetBtn = useTemplateRef<MaybeElement>('targetBtn');

const onClickTarget = () => {
  showMenu.value = !showMenu.value;
};

const emit = defineEmits<{
  click: [key: K];
}>();

const onClick = (key: K) => {
  emit('click', key);
  showMenu.value = false;
};
</script>

<template>
  <MDIconButton ref="targetBtn" tooltip="options" @click="onClickTarget">
    <template #icon>
      <MDSymbol name="more_vert" />
    </template>
  </MDIconButton>

  <MDMenu
    v-model:show="showMenu"
    :target-el="targetBtn"
    :disabled-teleport
    :btns
    @click="onClick"
  />
</template>
