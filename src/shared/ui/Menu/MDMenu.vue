<script
  setup
  lang="ts"
  generic="T extends MenuButtonDescription = MenuButtonDescription"
>
import type { MaybeElement } from '@vueuse/core';
import type { StyleValue } from 'vue';
import {
  computed,
  nextTick,
  toRefs,
  toValue,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import { unrefElement, useElementBounding, useWindowSize } from '@vueuse/core';
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

const props = defineProps<{
  targetEl: MaybeElement;
  btns: T[];
  transition?: boolean;
  outsideIgnore?: MaybeElement[];
}>();

const { targetEl, btns, outsideIgnore } = toRefs(props);

const emit = defineEmits<{
  click: [menuItem: T];
  clickOutside: [];
  deactivateFocus: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const onClick = (menuItem: T) => {
  emit('click', menuItem);
};

const listContainerEl = useTemplateRef('listContainerEl');

const {
  x: targetX,
  y: targetY,
  height: targetHeight,
  width: targetWidth,
} = useElementBounding(targetEl);

const { height: menusHeight, width: menusWidth } =
  useElementBounding(listContainerEl);

const { height: windowHeight, width: windowWidth } = useWindowSize();

const bottomSpace = computed(
  () => windowHeight.value - targetY.value - targetHeight.value,
);

const positionTop = computed((): `${number}px` => {
  const topSpace = targetY.value;

  if (menusHeight.value < bottomSpace.value || topSpace < bottomSpace.value) {
    return `${targetY.value + targetHeight.value}px`;
  }

  return `${Math.max(targetY.value - menusHeight.value, 0)}px`;
});

const maxHeight = computed((): `${number}px` => {
  const topSpace = targetY.value;

  if (menusHeight.value < bottomSpace.value || topSpace < bottomSpace.value) {
    return `${bottomSpace.value}px`;
  }

  return `${topSpace}px`;
});

const rightSpace = computed(() => windowWidth.value - targetX.value);

const leftSpace = computed(() => targetX.value + targetWidth.value);

const positionLeft = computed((): `${number}px` => {
  if (
    menusWidth.value < rightSpace.value ||
    leftSpace.value < rightSpace.value
  ) {
    return `${targetX.value}px`;
  }

  return `${Math.max(targetX.value + targetWidth.value - menusWidth.value, 0)}px`;
});

const minWidth = computed((): `${number}px` => `${targetWidth.value}px`);

const containerStyle = computed(
  (): StyleValue => ({
    top: positionTop.value,
    left: positionLeft.value,
    maxHeight: maxHeight.value,
    minWidth: minWidth.value,
  }),
);

const hasSomeSymbol = computed(() =>
  btns.value.some(({ symbolName }) => !!symbolName),
);

const targetTeleport = useClosestParentFrame();

const ignoreElements = computed(() => {
  if (outsideIgnore.value) {
    return [targetEl.value, ...outsideIgnore.value];
  }
  return [targetEl.value];
});

onInteractionOutside(
  listContainerEl,
  () => {
    emit('clickOutside');
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
