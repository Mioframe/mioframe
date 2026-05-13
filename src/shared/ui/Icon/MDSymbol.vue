<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useIconStates } from '@shared/ui/Icon/useMaterialDesignSymbols';

const props = defineProps<{
  /**
   * name from https://fonts.google.com/icons
   */
  name: string;
}>();

const { name } = toRefs(props);

const { useLoadSymbol, loadedSymbols } = useIconStates();

const ready = computed(() => loadedSymbols.has(name.value));

useLoadSymbol(name);
</script>

<template>
  <i
    class="md-symbol material-symbols-rounded"
    :class="[{ 'md-symbol_not-ready': !ready }]"
    translate="no"
    aria-hidden="true"
  >
    {{ name }}
  </i>
</template>

<style scoped>
.md-symbol {
  @property --md-symbol-size {
    syntax: '<absolute-size> | <relative-size> | <length-percentage [0,∞]> | math';
    inherits: false;
    initial-value: 24px;
  }
  @property --md-symbol-fill {
    syntax: '<number>';
    inherits: false;
    initial-value: 0;
  }
  @property --md-symbol-wght {
    syntax: '<number>';
    inherits: false;
    initial-value: 400;
  }
  @property --md-symbol-opsz {
    syntax: '<number>';
    inherits: false;
    initial-value: 24;
  }
  @property --md-symbol-grad {
    syntax: '<number>';
    inherits: false;
    initial-value: 0;
  }

  font-variation-settings:
    'FILL' var(--md-symbol-fill, 0),
    'wght' var(--md-symbol-wght, 400),
    'GRAD' var(--md-symbol-grad, 0),
    'opsz' var(--md-symbol-opsz, 24);

  font-size: var(--md-symbol-size, 24px);
  opacity: 1;
  overflow: hidden;
  transition-property: font-variation-settings, font-size;
  transition-duration: 0.1s;
  color: var(--md-content-color);
  display: inline-block;
  width: var(--md-symbol-size, 24px);
  height: var(--md-symbol-size, 24px);

  &_not-ready {
    opacity: 0;
  }
}
</style>
