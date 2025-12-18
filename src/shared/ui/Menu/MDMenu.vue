<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import type { MaybeElement } from '@vueuse/core';
import {
  computed,
  nextTick,
  ref,
  toRefs,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import { unrefElement, useEventListener } from '@vueuse/core';
import { MDListContainer } from '../Lists';
import type { MenuButtonDescription, MenuButtonList } from './types';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { autoUpdate, flip, shift, size, useFloating } from '@floating-ui/vue';
import MDMenuItem from './MDMenuItem.vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { useOverlayContainer } from '../Overlay';
import { useProvideFocusRegister } from './focusProvider';
import { useFastKeyboardInput } from '@shared/lib/useFastKeyboardInput';
import { useMatchSorter } from '@shared/lib/useMatchSorter';

const props = withDefaults(
  defineProps<{
    target: MaybeElement;
    btns?: MenuButtonList<T>;
    transition?: boolean;
    outsideIgnore?: MaybeElement[];
    disabledTeleport?: boolean;
    placement?: 'bottom-start' | 'right-start';
    ariaLabel?: string;
    role?: string;
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

defineSlots<{
  default: () => unknown;
}>();

const onClickItem = (menuItem: T) => {
  emit('click', menuItem);
};

const listContainerRef = useTemplateRef<MaybeElement>('listContainerRef');

const listContainerEl = computed(() => {
  const el = unrefElement(listContainerRef);
  if (el instanceof HTMLElement) {
    return el;
  }
  return undefined;
});

const { floatingStyles: containerStyle, update } = useFloating(
  target,
  listContainerEl,
  {
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
  },
);

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

const { activate: activateMenuFocusTrap, deactivate: deactivateMenuFocusTrap } =
  useFocusTrap(listContainerEl, {
    isKeyForward: ({ key }) => ['Tab', 'ArrowDown', 'ArrowRight'].includes(key),
    isKeyBackward: ({ key }) => ['ArrowUp', 'ArrowLeft'].includes(key),
    allowOutsideClick: true,
    initialFocus: false,
    onDeactivate: () => {
      emit('deactivateFocus');
    },
  });

watch(
  [showModel, listContainerEl],
  async ([showQuery, listContainerEl]) => {
    if (listContainerEl) {
      if (showQuery) {
        await nextTick();
        activateMenuFocusTrap();
      } else {
        await nextTick();
        deactivateMenuFocusTrap();
      }
    }
  },
  { immediate: true, flush: 'post' },
);

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

const showSubmenu = ref<boolean>();
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
      <slot>
        <MDMenuItem
          v-for="item in btns"
          :key="item.key"
          :item="item"
          :role="role === 'listbox' ? 'option' : undefined"
          @click="onClickItem"
          @update:show-submenu="showSubmenu = $event"
        />
      </slot>
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

  --md-list-item-horizontal-gap: 12px;
  --md-list-item-min-height: 48px;

  --md-list-item-container-color: var(--md-container-color);

  :deep() {
    .md-list-item__headline::first-letter {
      text-transform: uppercase;
    }
  }
}
</style>
