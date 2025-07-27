<script
  setup
  lang="ts"
  generic="T extends MenuButtonDescription = MenuButtonDescription"
>
import type { MaybeElement, VueInstance } from '@vueuse/core';
import {
  computed,
  nextTick,
  toRefs,
  toValue,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import { unrefElement } from '@vueuse/core';
import { MDListContainer, MDListItem } from '../Lists';
import type { MenuButtonDescription } from './types';
import { MDSymbol } from '../Icon';
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useKeyboardSearch } from '@shared/lib/useKeyboardSearch';
import { isUndefined } from 'es-toolkit';
import { useOverlayNavigation } from '@shared/lib/useOverlayNavigation';
import { uniqueId } from '@shared/lib/uniqueId';
import { autoUpdate, flip, shift, size, useFloating } from '@floating-ui/vue';

const props = defineProps<{
  target: MaybeElement;
  btns: T[];
  transition?: boolean;
  outsideIgnore?: MaybeElement[];
}>();

const { target, btns, outsideIgnore } = toRefs(props);

const emit = defineEmits<{
  click: [menuItem: T];
  interactionOutside: [];
  deactivateFocus: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const onClick = (menuItem: T) => {
  emit('click', menuItem);
};

const listContainerEl = useTemplateRef<
  HTMLElement | VueInstance | null | undefined
>('listContainerEl');

const { floatingStyles: containerStyle } = useFloating(
  target,
  listContainerEl,
  {
    strategy: 'fixed',
    transform: false,
    placement: 'bottom-start',
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
        }) {
          Object.assign(elements.floating.style, {
            minWidth: `${width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  },
);

const hasSomeSymbol = computed(() =>
  btns.value.some(({ symbolName }) => !!symbolName),
);

const targetTeleport = useClosestParentFrame();

const ignoreElements = computed(() => {
  if (outsideIgnore.value) {
    return [target.value, ...outsideIgnore.value];
  }
  return [target.value];
});

onInteractionOutside(
  listContainerEl,
  () => {
    emit('interactionOutside');
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

watchEffect(
  () => {
    if (listContainerEl.value) {
      if (show.value) {
        void nextTick(activateMenuFocusTrap);
      } else {
        void nextTick(deactivateMenuFocusTrap);
      }
    }
  },
  { flush: 'post' },
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
  if (show.value) {
    const foundEl = toValue(foundRef);

    if (foundEl instanceof HTMLElement) {
      foundEl.focus();
    }
  }
});

const { show: showOverlay } = useOverlayNavigation(uniqueId('menu'));

const showOverlayWatchHandler = watch(showOverlay, (showOverlay) => {
  showWatchHandler.pause();
  show.value = showOverlay;
  void nextTick(showWatchHandler.resume);
});

const showWatchHandler = watch(
  show,
  (show) => {
    showOverlayWatchHandler.pause();
    showOverlay.value = show;
    void nextTick(showOverlayWatchHandler.resume);
  },
  { immediate: true },
);
</script>

<template>
  <Teleport :to="targetTeleport">
    <MDListContainer
      is="div"
      v-if="showOverlay"
      ref="listContainerEl"
      class="md md-menu"
      :style="containerStyle"
      :transition="transition"
    >
      <MDListItem
        is="button"
        v-for="item in btns"
        :key="item.key"
        :headline="item.label"
        type="button"
        @click="onClick(item)"
      >
        <template v-if="hasSomeSymbol" #leadingIcon>
          <MDSymbol v-if="item.symbolName" :name="item.symbolName" />
        </template>
      </MDListItem>
    </MDListContainer>
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
