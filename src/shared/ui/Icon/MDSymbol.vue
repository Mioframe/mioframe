<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useIconStates } from './iconStates';

const props = defineProps<{
  // from https://fonts.google.com/icons
  name: string;
  style?: 'rounded' | 'outlined' | 'sharp';
}>();

const styleSetting = computed(() => props.style ?? 'rounded');

const classSymbol = computed(() => `material-symbols-${styleSetting.value}`);

const { loadSymbol } = useIconStates();

watchEffect(() => {
  loadSymbol(styleSetting.value, props.name);
});
</script>

<template>
  <i class="md-symbol" :class="[classSymbol]">{{ name }} </i>
</template>

<style lang="scss" scoped>
.md-symbol {
  --md-symbol-fill: 0;
  --md-symbol-wght: 400;
  --md-symbol-opsz: 24;
  --md-symbol-grad: 0;

  font-variation-settings:
    'FILL' var(--md-symbol-fill),
    'wght' var(--md-symbol-wght),
    'GRAD' var(--md-symbol-grad),
    'opsz' var(--md-symbol-opsz);
}
</style>
