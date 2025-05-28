<script setup lang="ts">
import { ref, toRef } from 'vue';
import MDPlainTooltip from './MDPlainTooltip.vue';
import { type MaybeElement } from '@vueuse/core';
import { setupTooltip } from './setupTooltip';

const tooltipEl = ref<MaybeElement>();

const { targetElement } = defineProps<{
  targetElement: HTMLElement;
  text: string;
}>();

const targetElementRef = toRef(() => targetElement);

const { tooltipStyle } = setupTooltip(targetElementRef, tooltipEl);
</script>

<template>
  <MDPlainTooltip
    ref="tooltipEl"
    class="tooltip-item"
    :text
    :style="tooltipStyle"
  />
</template>
