<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useWindowSizeClass, WindowClass } from './useWindowSizeClass';
import { MDTopAppBar } from '../TopAppBar';
import { MDIconButton } from '../Button';
import { MDSymbol } from '../Icon';
import { useCssVar } from '@vueuse/core';

const { showSecond = false, secondHeadline = '' } = defineProps<{
  showSecond?: boolean;
  secondHeadline?: string;
}>();

const emit = defineEmits<{
  clickCloseSecond: [];
}>();

const slots = defineSlots<{
  navigation(): unknown;
  firstPane(): unknown;
  secondPane(): unknown;
}>();

const { windowClass } = useWindowSizeClass();

const isShowFirstPane = computed(
  () => !showSecond || windowClass.value !== WindowClass.Compact,
);

const onClickBack = () => {
  emit('clickCloseSecond');
};

const firstPaneSize = computed((): number => {
  if (isShowFirstPane.value) {
    if (windowClass.value === WindowClass.Medium) {
      return 50;
    }
    if (showSecond) {
      return 30;
    }
    return 100;
  }
  return 0;
});

const bodyRef = ref<HTMLElement>();

const firstPaneSizeCssVar = useCssVar('--md-first-pane-width', bodyRef);
const secondPaneSizeCssVar = useCssVar('--md-second-pane-width', bodyRef);

watchEffect(() => {
  firstPaneSizeCssVar.value = `${firstPaneSize.value}%`;
});
watchEffect(() => {
  secondPaneSizeCssVar.value = `${100 - firstPaneSize.value}%`;
});

const windowClassModifier = computed(() => {
  switch (windowClass.value) {
    case WindowClass.Compact:
      return 'md-layer_compact';
    case WindowClass.Medium:
      return 'md-layer_medium';
    case WindowClass.Expanded:
      return 'md-layer_expanded';
    case WindowClass.Large:
      return 'md-layer_large';
    case WindowClass.ExtraLarge:
      return 'md-layer_extra-large';
    default:
      return undefined;
  }
});
</script>

<template>
  <main class="md md-layer" :class="[windowClassModifier]">
    <nav v-if="!!slots.navigation" class="md-layer__navigation">
      <slot name="navigation" />
    </nav>

    <section ref="bodyRef" class="md-layer__body body">
      <div v-if="isShowFirstPane" class="body__first-pane">
        <slot name="firstPane" />
      </div>

      <div v-if="showSecond" class="body__second-pane">
        <div class="md body__container">
          <MDTopAppBar :headline="secondHeadline">
            <template #leadingNavigation>
              <MDIconButton tooltip="back" @click="onClickBack">
                <template #icon>
                  <MDSymbol v-if="isShowFirstPane" name="close" />

                  <MDSymbol v-else name="arrow_back" />
                </template>
              </MDIconButton>
            </template>
          </MDTopAppBar>

          <slot name="secondPane" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.md-layer {
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
  overflow: auto;
  --md-container-color: var(--md-sys-color-surface-container);
  --md-content-color: var(--md-sys-color-on-surface);

  &__navigation {
    flex-grow: 1;
    flex-shrink: 0;
  }

  &__body {
    flex-grow: 1;
    flex-shrink: 0;
    max-height: 100%;
  }
}

.body {
  display: flex;

  &__second-pane,
  &__first-pane {
    --md-pane-padding: 16px;

    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 4px var(--md-pane-padding);
    overflow-y: auto;
    transition: none;

    .md-layer_compact & {
      --md-pane-padding: 0px;
      padding: 0 var(--md-pane-padding);
    }
  }

  &__first-pane {
    flex-basis: var(--md-first-pane-width, auto);
  }

  &__second-pane {
    flex-basis: var(--md-second-pane-width, auto);
  }

  &__container {
    position: relative;
    flex: 1 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: 16px;
    --md-container-color: var(--md-sys-color-surface);
    --md-content-color: var(--md-sys-color-on-surface);
    overflow-y: auto;
  }
}
</style>
