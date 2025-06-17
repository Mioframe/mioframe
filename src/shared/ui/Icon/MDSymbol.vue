<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { MaterialSymbolsFamily, useIconStates } from './useIconStates';

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
  --md-symbol-size: inherit;
  --md-symbol-fill: inherit;
  --md-symbol-wght: inherit;
  --md-symbol-opsz: inherit;
  --md-symbol-grad: inherit;

  font-variation-settings:
    'FILL' var(--md-symbol-fill, 0),
    'wght' var(--md-symbol-wght, 400),
    'GRAD' var(--md-symbol-grad, 0),
    'opsz' var(--md-symbol-opsz, 24);

  font-size: var(--md-symbol-size, 24px);
}
</style>
