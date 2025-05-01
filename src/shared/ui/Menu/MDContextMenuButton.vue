<script
  setup
  lang="ts"
  generic="K extends PropertyKey, T extends ContextButtonDescription"
>
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useRootElement } from '@shared/lib/useRootElement';
import { MDIconButton } from '@shared/ui/Button';
import { MDMenus, MDMenusListItem } from '@shared/ui/Menu';
import { MDSymbol } from '@shared/ui/Icon';
import type { MaybeElement } from '@vueuse/core';
import { ref, shallowRef } from 'vue';
import type { ContextButtonDescription } from './types';

const {} = defineProps<{
  btns: Iterable<[K, T]>;
  disabledTeleport?: boolean;
}>();

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

const emit = defineEmits<{
  click: [key: K];
}>();

const root = useRootElement();

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

  <Teleport v-if="showMenu" defer :to="root" :disabled="disabledTeleport">
    <MDMenus ref="menuEl" :target-ref="targetBtn">
      <MDMenusListItem
        v-for="[key, { symbolName, text }] in btns"
        :key
        :text
        @click="onClick(key)"
      >
        <template #leadingIcon>
          <MDSymbol :name="symbolName" />
        </template>
      </MDMenusListItem>
    </MDMenus>
  </Teleport>
</template>
