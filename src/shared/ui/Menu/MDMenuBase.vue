<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import type { MaybeElement } from '@vueuse/core';
import { computed, nextTick, toRefs, useTemplateRef, watch, watchEffect } from 'vue';
import { tryOnBeforeUnmount, unrefElement, useEventListener } from '@vueuse/core';
import { MDListContainer } from '../Lists';
import type { MenuButtonDescription } from './types';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { autoUpdate, flip, shift, size, useFloating } from '@floating-ui/vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { useOverlayContainer } from '../Overlay';
import { useProvideFocusRegister } from './focusProvider';
import { useFastKeyboardInput } from '@shared/lib/useFastKeyboardInput';
import { useMatchSorter } from '@shared/lib/useMatchSorter';
import { useOnEscapeKeyStackedWhen } from '@shared/lib/useOnEscapeKeyStacked';
import { useOnBackNavigationStackedWhen } from '@shared/lib/onBackNavigation';

const showModel = defineModel<boolean>('show', { required: true });

const props = withDefaults(
  defineProps<{
    target: MaybeElement;
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

const emit = defineEmits<{
  interactionOutside: [];
  deactivateFocus: [];
}>();

defineSlots<{
  default: () => unknown;
}>();

const { target, outsideIgnore, placement } = toRefs(props);

const listContainerRef = useTemplateRef<MaybeElement>('listContainerRef');

const listContainerEl = computed(() => {
  const el = unrefElement(listContainerRef);
  if (el instanceof HTMLElement) {
    return el;
  }
  return undefined;
});

const { floatingStyles: containerStyle, update } = useFloating(target, listContainerEl, {
  strategy: 'fixed',
  transform: false,
  placement,
  middleware: [
    flip({
      padding: 16,
    }),
    shift({ padding: 16, crossAxis: true }),
    size({
      padding: 16,
      apply({
        elements,
        rects: {
          reference: { width },
        },
        availableHeight,
      }) {
        Object.assign(elements.floating.style, {
          minWidth: `${width}px`,
          maxHeight: `${availableHeight}px`,
        });
      },
    }),
  ],
  whileElementsMounted: autoUpdate,
});

useEventListener(window.visualViewport, 'resize', update);

const targetTeleport = useOverlayContainer();

const ignoreElements = computed(() => {
  if (outsideIgnore.value) {
    return [target.value, ...outsideIgnore.value];
  }
  return [target.value];
});

onInteractionOutside(
  listContainerRef,
  () => {
    emit('interactionOutside');
    showModel.value = false;
  },
  {
    ignore: ignoreElements,
  },
);

const { activate: activateMenuFocusTrap, deactivate: deactivateMenuFocusTrap } = useFocusTrap(
  listContainerEl,
  {
    allowOutsideClick: true,
    isKeyForward: ({ key }) => ['Tab', 'ArrowDown', 'ArrowRight'].includes(key),
    isKeyBackward: ({ key }) => ['ArrowUp', 'ArrowLeft'].includes(key),
    onDeactivate: () => {
      emit('deactivateFocus');
    },
  },
);

watch(
  [showModel, listContainerEl],
  async ([showQuery]) => {
    if (showQuery) {
      await nextTick();
      if (listContainerEl.value) {
        activateMenuFocusTrap();
      }
    } else {
      deactivateMenuFocusTrap();
    }
  },
  { immediate: true, flush: 'post' },
);

tryOnBeforeUnmount(deactivateMenuFocusTrap);

const focusRegister = useProvideFocusRegister();

const searchList = computed(() => Array.from(focusRegister.keys()));

const keyboardInput = useFastKeyboardInput();

const matchedText = useMatchSorter(searchList, keyboardInput);

const firstMatchText = computed(() => matchedText.value?.at(0));

watchEffect(() => {
  if (showModel.value && firstMatchText.value) {
    focusRegister.get(firstMatchText.value)?.();
  }
});

const closeMenu = () => {
  showModel.value = false;
};

useOnEscapeKeyStackedWhen(showModel, () => {
  closeMenu();
  return false;
});

useOnBackNavigationStackedWhen(showModel, () => {
  closeMenu();
  return false;
});
</script>

<template>
  <TeleportContainer
    :to="targetTeleport"
    :disabled="disabledTeleport"
    :container="listContainerRef"
  >
    <MDListContainer
      is="div"
      v-if="showModel"
      ref="listContainerRef"
      class="md md-menu"
      :style="containerStyle"
      :transition="transition"
      :aria-label="ariaLabel"
      :role="role"
    >
      <slot />
    </MDListContainer>
  </TeleportContainer>
</template>

<style lang="css" scoped>
.md-menu {
  position: fixed;
  z-index: 2;
  overflow-y: auto;
  pointer-events: all;

  border-radius: var(--md-sys-shape-corner-extra-small);
  box-shadow: var(--md-sys-elevation-level2);
  --md-container-color: var(--md-sys-color-surface-container);
  display: flex;
  flex-direction: column;

  --md-list-container-border-radius: 0px;
  --md-comp-list-item-horizontal-padding: 12dp;
  --md-comp-list-item-trailing-end-padding: 12dp;
  --md-comp-list-item-container-height: 48dp;
  --md-comp-list-item-container-color: var(--md-container-color);
  --md-comp-list-item-container-shape: 0dp;
}
</style>
