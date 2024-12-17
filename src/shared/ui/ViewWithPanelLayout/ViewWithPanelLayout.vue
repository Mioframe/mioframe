<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { SlidingPanel } from '../SlidingPanel';
import { useMediaQuery, type MaybeElement } from '@vueuse/core';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { vElementHover } from '@vueuse/components';
import { createLogger } from '@shared/lib/logger';
import { UIButton } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

const { debug } = createLogger('ViewWithPanelLayout');

defineSlots<{
  default(): unknown;
  panel(): unknown;
}>();

const refSlidingPanel = ref<MaybeElement>();

const openModel = defineModel<boolean>('openPanel');

const localStateOpenPanel = ref(true);

const isOpenPanel = computed({
  get: () =>
    isPinPanel.value
      ? localStateOpenPanel.value
      : (openModel.value ?? localStateOpenPanel.value),
  set: (v: boolean) => {
    debug('set isOpenPanel', v);
    openModel.value = v;
    localStateOpenPanel.value = v;
  },
});

const isPinPanel = ref(false);

const isHoverPanel = ref(false);

const onHoverPanel = (state: boolean) => {
  isHoverPanel.value = state;
};

const isLandscape = useMediaQuery('(orientation: landscape)');

const onClickTogglePanelBtn = () => {
  debug('onClickTogglePanelBtn');
  isOpenPanel.value = !isOpenPanel.value;
};

onInteractionOutside(refSlidingPanel, () => {
  if (!isPinPanel.value && isLandscape.value) {
    isOpenPanel.value = false;
  }
});

watchEffect(() => {
  debug('watchEffect');
  if (!isPinPanel.value && isLandscape.value && isHoverPanel.value) {
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
        <ButtonGroup>
          <UIButton
            class="panel__toggle is-small is-borderless is-shadowless"
            :primary="!isOpenPanel"
            :grow="!isLandscape"
            @pointerdown="onClickTogglePanelBtn"
          >
            <template #icon>
              <i
                class="fa-solid fa-chevron-up"
                :class="{
                  'fa-rotate-270': isLandscape && !isOpenPanel,
                  'fa-rotate-90': isLandscape && isOpenPanel,
                  'fa-flip-vertical': !isLandscape && isOpenPanel,
                }"
              />
            </template>
          </UIButton>

          <UIButton
            class="is-small is-borderless is-shadowless"
            :primary="!isOpenPanel"
            @click="isPinPanel = !isPinPanel"
          >
            <template #icon>
              <i v-if="isPinPanel" class="fa-solid fa-thumbtack-slash" />

              <i v-else class="fa-solid fa-thumbtack" />
            </template>
          </UIButton>
        </ButtonGroup>

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
      min-width: 420px;
      max-width: 70vw;
    }
  }

  &__toggle {
    @media screen and (orientation: landscape) {
      width: var(--sliding-panel-min-width);
    }
  }

  &__menu-list {
    @media screen and (orientation: landscape) {
      overflow-x: auto;
    }
  }
}
</style>
