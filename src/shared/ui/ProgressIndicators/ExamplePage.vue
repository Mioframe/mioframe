<script setup lang="ts">
import { ref } from 'vue';
import MDCircularProgressIndicator from './MDCircularProgressIndicator.vue';

const progress = ref(0.33);
</script>

<template>
  <div class="grid">
    <div>
      <div>{{ progress }}</div>

      <input v-model.number="progress" type="range" min="0" max="1" step="0.00001" />
    </div>

    <MDCircularProgressIndicator :progress="progress" />
  </div>
</template>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 16px;
  justify-content: center;
  align-items: center;
  background-color: var(--md-sys-color-surface);
  --md-container-color: var(--md-sys-color-surface);
}
</style>
