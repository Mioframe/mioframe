<script setup lang="ts">
import { computed, toRefs, watch } from 'vue';
import { useIconStates } from './useMaterialDesignSymbols';

const props = defineProps<{
  // from https://fonts.google.com/icons
  name: string;
}>();

const { name } = toRefs(props);

const { addLoadSymbol, loadedSymbols } = useIconStates();

const ready = computed(() => loadedSymbols.has(name.value));

watch(
  name,
  (name) => {
    addLoadSymbol(name);
  },
  { immediate: true },
);
</script>

<template>
  <i
    class="md-symbol md material-symbols-rounded"
    :class="[{ 'md-symbol_not-ready': !ready }]"
  >
    {{ name }}
  </i>
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
  opacity: 1;

  &_not-ready {
    display: inline-block;
    opacity: 0;
    width: 0;
    overflow: hidden;
  }
}
</style>
