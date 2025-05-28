<script setup lang="ts">
import { useTooltip } from './directiveTooltip';

import { FadeTransition } from '@noction/vue-bezier';
import PlainTooltipItem from './PlainTooltipItem.vue';
import { useRootElement } from '@shared/lib/useRootElement';

const { showerTooltips } = useTooltip();

const rootEl = useRootElement();
</script>

<template>
  <Teleport :to="rootEl">
    <FadeTransition group>
      <PlainTooltipItem
        v-for="([targetElement, text], index) in showerTooltips"
        :key="text + index"
        class="tooltip-container__tooltip"
        :text
        :target-element="targetElement"
      />
    </FadeTransition>
  </Teleport>
</template>

<style scoped>
.tooltip-container {
  &__tooltip {
    position: fixed;
    z-index: 100;
  }
}
</style>
