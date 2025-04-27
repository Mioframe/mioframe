<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { MaterialSymbolsFamily, useIconStates } from './iconStates';

const { name, style = 'rounded' } = defineProps<{
  // from https://fonts.google.com/icons
  name: string;
  style?: 'rounded' | 'outlined' | 'sharp';
}>();

const styleSetting = computed(() => {
  switch (style) {
    case 'outlined':
      return MaterialSymbolsFamily.Outlined;
    case 'sharp':
      return MaterialSymbolsFamily.Sharp;
    default:
      return MaterialSymbolsFamily.Rounded;
  }
});

const classSymbol = computed(() => `material-symbols-${style}`);

const { push } = useIconStates();

watchEffect(() => {
  push(styleSetting.value, name);
});
</script>

<template>
  <i class="md-symbol" :class="[classSymbol]">{{ name }} </i>
</template>

<style scoped>
.md-symbol {
  --md-symbol-size: 24px;
  --md-container-color: transparent;
  --md-symbol-fill: 0;
  --md-symbol-wght: 400;
  --md-symbol-opsz: 24;
  --md-symbol-grad: 0;

  font-variation-settings:
    'FILL' var(--md-symbol-fill),
    'wght' var(--md-symbol-wght),
    'GRAD' var(--md-symbol-grad),
    'opsz' var(--md-symbol-opsz);

  font-size: var(--md-symbol-size);
}
</style>
