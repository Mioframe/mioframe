<script setup lang="ts">
import { ref } from 'vue';
import MDIconButton from './MDIconButton.vue';

const clickCount = ref(0);

const onClick = () => {
  clickCount.value += 1;
};
</script>

<template>
  <div
    id="visual-md-icon-button-target-hit"
    class="visual-checker-backdrop md-icon-button-target-hit"
  >
    <div class="md-icon-button-target-hit__stage">
      <MDIconButton tooltip="Expanded target" size="small" md-symbol-name="add" @click="onClick" />
    </div>
    <p class="md-icon-button-target-hit__status">
      Click count:
      <output id="visual-md-icon-button-target-hit-count">{{ clickCount }}</output>
    </p>
  </div>
</template>

<style scoped>
.md-icon-button-target-hit {
  display: grid;
  place-items: center;
  gap: 12dp;
  padding: 24dp;

  &__stage {
    display: grid;
    place-items: center;
    width: 96dp;
    height: 96dp;
  }

  &__status {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
