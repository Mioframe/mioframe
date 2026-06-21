<script setup lang="ts">
import { toRefs } from 'vue';
import { provideMDStateLayerForcedState } from './forcedState';

/**
 * Story/test-only fragment that forces a visual state on every nested
 * `MDStateLayer`, regardless of how deeply it is nested inside the host
 * component. Renders no DOM of its own. Do not use in product code.
 */
const props = defineProps<{
  // eslint-disable-next-line vue/no-unused-properties -- consumed via toRefs(props) below; rule cannot trace indirect usage
  hovered?: boolean;
  // eslint-disable-next-line vue/no-unused-properties -- consumed via toRefs(props) below; rule cannot trace indirect usage
  focused?: boolean;
  // eslint-disable-next-line vue/no-unused-properties -- consumed via toRefs(props) below; rule cannot trace indirect usage
  pressed?: boolean;
  // eslint-disable-next-line vue/no-unused-properties -- consumed via toRefs(props) below; rule cannot trace indirect usage
  dragged?: boolean;
}>();

defineSlots<{
  default: () => unknown;
}>();

provideMDStateLayerForcedState(toRefs(props));
</script>

<template>
  <slot />
</template>
