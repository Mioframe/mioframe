<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import type { MaybeElement, VueInstance } from '@vueuse/core';
import {
  computed,
  nextTick,
  ref,
  toRefs,
  toValue,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import { unrefElement, useEventListener } from '@vueuse/core';
import { MDListContainer } from '../Lists';
import type { MenuButtonDescription, MenuButtonList } from './types';
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useKeyboardSearch } from '@shared/lib/useKeyboardSearch';
import { isUndefined } from 'es-toolkit';
import { autoUpdate, flip, shift, size, useFloating } from '@floating-ui/vue';
import MDMenuItem from './MDMenuItem.vue';
import { useOverlay } from '../Overlay';
import { TeleportContainer } from '@shared/lib/teleportContainer';

const props = withDefaults(
  defineProps<{
    target: MaybeElement;
    btns: MenuButtonList<T>;
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

const onClickItem = (menuItem: T) => {
  emit('click', menuItem);
};

const listContainerEl = useTemplateRef<
  HTMLElement | VueInstance | null | undefined
>('listContainerEl');

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

const targetTeleport = useClosestParentFrame();

const ignoreElements = computed(() => {
  if (outsideIgnore.value) {
    return [target.value, ...outsideIgnore.value];
  }
  return [target.value];
});

const {} = useOverlay(listContainerEl, showModel, 'overlay');

onInteractionOutside(
  listContainerEl,
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
  ([showQuery, listContainerEl]) => {
    if (listContainerEl) {
      if (showQuery) {
        void nextTick(activateMenuFocusTrap);
      } else {
        void nextTick(deactivateMenuFocusTrap);
      }
    }
  },
  { immediate: true },
);

const searchList = computed(() => btns.value.map(({ label }) => label));

const { foundIndex: keyboardFoundIndex } = useKeyboardSearch(searchList);

const listItemElList = computed(() => {
  const children = unrefElement(listContainerEl)?.children;

  if (children) {
    return Array.from(children);
  }

  return undefined;
});

const foundRef = computed(() =>
  !isUndefined(keyboardFoundIndex.value)
    ? listItemElList.value?.at(keyboardFoundIndex.value)
    : undefined,
);

watchEffect(() => {
  if (showModel.value) {
    const foundEl = toValue(foundRef);

    if (foundEl instanceof HTMLElement) {
      foundEl.focus();
    }
  }
});

const showSubmenu = ref<boolean>();
</script>

<template>
  <TeleportContainer
    :to="targetTeleport"
    :disabled="disabledTeleport"
    :container="listContainerEl"
  >
    <MDListContainer
      is="div"
      v-if="showModel"
      ref="listContainerEl"
      class="md md-menu"
      :style="containerStyle"
      :transition="transition"
      :aria-label="ariaLabel"
      :role="role"
    >
      <MDMenuItem
        v-for="item in btns"
        :key="item.key"
        :item="item"
        :role="role === 'listbox' ? 'option' : undefined"
        @click="onClickItem"
        @update:show-submenu="showSubmenu = $event"
      />
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
