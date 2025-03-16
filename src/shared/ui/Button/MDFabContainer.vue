<script setup lang="ts">
import FixedPlaceholder from '../Layers/FixedPlaceholder.vue';

defineSlots<{
  content(): unknown;
  buttons(): unknown;
}>();
</script>

<template>
  <FixedPlaceholder
    class="md-fab-container__placeholder"
    priority-width="placeholder"
  >
    <div class="md-fab-container">
      <slot name="buttons" />
    </div>
  </FixedPlaceholder>
</template>

<style scoped>
.md-fab-container {
  display: flex;
  flex-direction: column;
  pointer-events: none;
  background-color: transparent;
  align-items: center;
  align-self: flex-end;
  justify-self: flex-end;
  margin-top: auto;
  margin-left: auto;
  padding-bottom: 16px;
  width: min-content;

  &__placeholder {
    display: flex;
  }

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
  /* } */
}
</style>
