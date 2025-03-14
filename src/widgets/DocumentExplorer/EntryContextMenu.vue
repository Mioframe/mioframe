<script setup lang="ts">
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useRootElement } from '@shared/lib/useRootElement';
import { MDIconButton } from '@shared/ui/Button';
import { MDMenus, MDMenusListItem } from '@shared/ui/Menu';
import { MDSymbol } from '@shared/ui/Icon';
import type { MaybeElement } from '@vueuse/core';
import { ref, shallowRef } from 'vue';

const showMenu = ref(false);

const targetBtn = shallowRef<MaybeElement>();
const menuEl = shallowRef<MaybeElement>();

const onClickTarget = () => {
  showMenu.value = !showMenu.value;
};

onInteractionOutside(
  menuEl,
  () => {
    showMenu.value = false;
  },
  {
    ignore: [targetBtn],
  },
);

defineEmits<{
  removeEntry: [];
}>();

const root = useRootElement();
</script>

<template>
  <MDIconButton ref="targetBtn" tooltip="options" @click="onClickTarget">
    <template #icon>
      <MDSymbol name="more_vert" />
    </template>
  </MDIconButton>

  <Teleport v-if="showMenu" defer :to="root">
    <MDMenus ref="menuEl" :target-ref="targetBtn">
      <MDMenusListItem
        text="Remove"
        @click="
          $emit('removeEntry');
          showMenu = false;
        "
      >
        <template #leadingIcon>
          <MDSymbol name="delete" />
        </template>
      </MDMenusListItem>
    </MDMenus>
  </Teleport>
</template>
