<script
  setup
  lang="ts"
  generic="K extends PropertyKey, T extends MenuButtonDescription"
>
import type { MaybeElement } from '@vueuse/core';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { syncRef } from '@vueuse/core';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import MDMenuContainer from './MDMenuContainer.vue';
import type { MenuButtonDescription } from './types';
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import { createLogger } from '@shared/lib/logger';

const { debug } = createLogger('MDMenu');

const { targetEl, outsideIgnore } = defineProps<{
  targetEl: MaybeElement;
  outsideIgnore?: MaybeElement[];
  btns?: Iterable<[K, T]>;
}>();

defineSlots<{
  default(): unknown;
}>();

const emit = defineEmits<{
  click: [key: K];
}>();

const onClick = (key: K) => {
  emit('click', key);
};

const rootEl = useTemplateRef<MaybeElement>('rootEl');

const targetRef = computed(() => targetEl);

const targetTeleport = useClosestParentFrame();

watch(
  targetTeleport,
  (el) => {
    debug('targetTeleport', el);
  },
  { immediate: true },
);

const modelShow = defineModel<boolean>('show', { default: false });

const stateShow = ref(false);

syncRef(stateShow, modelShow);

const ignoreElements = computed(() => {
  if (outsideIgnore) {
    return [targetRef.value, ...outsideIgnore];
  }
  return [targetRef.value];
});

onInteractionOutside(
  rootEl,
  () => {
    stateShow.value = false;
  },
  {
    ignore: ignoreElements,
  },
);
</script>

<template>
  <Teleport defer :to="targetTeleport">
    <MDMenuContainer
      v-if="stateShow"
      ref="rootEl"
      :target-ref="targetRef"
      :btns
      class="md md-menu"
      @click="onClick"
    >
      <slot />
    </MDMenuContainer>
  </Teleport>
</template>

<style lang="css" scoped>
.md-menu {
  position: fixed;
  z-index: 1;
  overflow-y: auto;

  border-radius: var(--md-sys-shape-corner-extra-small);
  box-shadow: var(--md-sys-elevation-level2);
  --md-container-color: var(--md-sys-color-surface-container);
  display: flex;
  flex-direction: column;

  --md-list-container-border-radius: 0px;
}
</style>
