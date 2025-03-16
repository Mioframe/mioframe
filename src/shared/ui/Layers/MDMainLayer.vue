<script setup lang="ts">
import { computed } from 'vue';
import { useWindowSizeClass, WindowClass } from './useWindowSizeClass';

const { showSecond = false } = defineProps<{
  showSecond?: boolean;
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
</script>

<template>
  <main class="md-layer">
    <nav v-if="!!$slots.navigation" class="md-layer__navigation">
      <slot name="navigation" />
    </nav>

    <section class="md-layer__body body">
      <div v-if="isShowFirstPane" class="body__first-pane">
        <slot name="firstPane" />
      </div>

      <div v-if="showSecond" class="body__second-pane">
        <slot name="secondPane" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.md-layer {
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
  /* padding-left: 16px;
  padding-right: 16px; */
  overflow: auto;
  --md-container-color: var(--md-sys-color-surface-container);

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
    flex: 1 0;
    padding: 4px var(--md-pane-padding);
    overflow-y: auto;
  }
}
</style>
