<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { SlidingPanel } from '../SlidingPanel';
import { useMediaQuery, type MaybeElement } from '@vueuse/core';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { vElementHover } from '@vueuse/components';

defineSlots<{
  default(): unknown;
  panel(): unknown;
}>();

const refSlidingPanel = ref<MaybeElement>();

const openModel = defineModel<boolean>('openPanel');

const localStateOpenPanel = ref(true);

const isOpenPanel = computed({
  get: () => openModel.value ?? localStateOpenPanel.value,
  set: (v: boolean) => {
    openModel.value = v;
    localStateOpenPanel.value = v;
  },
});

const isHoverPanel = ref(false);

const onHoverPanel = (state: boolean) => {
  isHoverPanel.value = state;
};

const isLandscape = useMediaQuery('(orientation: landscape)');

const onClickTogglePanelBtn = () => {
  isOpenPanel.value = !isOpenPanel.value;
};

onInteractionOutside(refSlidingPanel, () => {
  if (isLandscape.value) {
    isOpenPanel.value = false;
  }
});

watchEffect(() => {
  if (isLandscape.value && isHoverPanel.value) {
    isOpenPanel.value = true;
  }
});
</script>

<template>
  <div class="main-view">
    <slot />

    <SlidingPanel
      ref="refSlidingPanel"
      v-model:open="isOpenPanel"
      v-element-hover="onHoverPanel"
      class="main-view__panel panel"
      :right="isLandscape"
      :class="{
        _open: isOpenPanel,
      }"
    >
      <div
        class="card panel__card"
        :class="{
          'has-background-primary': !isOpenPanel,
        }"
      >
        <button
          type="button"
          class="panel__toggle button is-transparent is-small is-fullwidth"
          :class="{
            'is-primary': !isOpenPanel,
          }"
          @pointerdown="onClickTogglePanelBtn"
        >
          <span class="icon">
            <i
              class="fa-solid fa-chevron-up"
              :class="{
                'fa-flip-vertical': isOpenPanel,
              }"
            />
          </span>
        </button>

        <slot name="panel" />
      </div>
    </SlidingPanel>
  </div>
</template>

<style lang="scss" scoped>
.main-view {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: flex-end;
  overflow: auto;

  &__panel {
    --sliding-panel-min-height: 134px;
    --sliding-panel-min-width: 30px;
  }

  @media screen and (orientation: landscape) {
    flex-direction: row;
    gap: 8px;

    &__panel {
      width: 320px;
      max-width: 35vw;
      max-height: 100%;
      overflow-y: auto;
      align-self: center;
    }
  }
}

.panel {
  &__card {
    min-height: var(--sliding-panel-min-height);
    transition-duration: var(--bulma-duration);
    transition-property: background-color;

    @media screen and (orientation: landscape) {
      max-height: 100%;
      min-height: auto;
      overflow-y: auto;

      width: 30vw;
      min-width: 320px;
    }
  }

  &__toggle {
    border: 0;
    box-shadow: none;

    @media screen and (orientation: landscape) {
      width: var(--sliding-panel-min-width);
      transform: rotate(-90deg);
    }
  }

  &__menu-list {
    @media screen and (orientation: landscape) {
      overflow-x: auto;
    }
  }
}
</style>
