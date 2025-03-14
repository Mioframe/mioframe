<script setup lang="ts">
import { useCssVar, useElementSize } from '@vueuse/core';
import { computed, ref, watchEffect } from 'vue';

defineSlots<{
  content(): unknown;
  buttons(): unknown;
}>();

const buttonsEl = ref<HTMLDivElement>();

const containerEl = ref<HTMLDivElement>();

const { height: buttonsHeight } = useElementSize(buttonsEl);

const fabHeights = computed(() => buttonsHeight.value || 0);

const fabHeightsCssVar = useCssVar('--md-fab-heights', containerEl);

watchEffect(() => {
  fabHeightsCssVar.value = `${fabHeights.value}px`;
});
</script>

<template>
  <div ref="containerEl" class="md-fab-container">
    <slot name="content" />

    <div ref="buttonsEl" class="md-fab-container__buttons">
      <slot name="buttons" />
    </div>
  </div>
</template>

<style scoped>
.md-fab-container {
  display: flex;
  flex-direction: column;
  flex: 1 1;
  overflow-y: auto;
  padding-bottom: var(--md-fab-heights);

  &__buttons {
    position: fixed;
    bottom: 16px;
    right: var(--md-pane-padding, 16px);
    display: flex;
    flex-direction: column;
    pointer-events: none;
    background-color: transparent;
    align-items: center;
    align-self: flex-end;
    justify-self: flex-end;
    margin-top: auto;
    margin-left: auto;

    :deep() {
      > * {
        pointer-events: auto;
      }

      > .md-fab {
        margin-top: 16px;

        &:not(.md-fab_small) {
          margin-top: 24px;
        }
      }
    }
  }
}
</style>
