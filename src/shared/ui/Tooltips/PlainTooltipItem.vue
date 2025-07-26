<script setup lang="ts">
import { ref, toRef } from 'vue';
import MDPlainTooltip from './MDPlainTooltip.vue';
import { type MaybeElement } from '@vueuse/core';

const tooltipEl = ref<MaybeElement>();

const { targetElement } = defineProps<{
  targetElement: HTMLElement;
  text: string;
}>();

const targetElementRef = toRef(() => targetElement);
</script>

<template>
  <MDPlainTooltip
    ref="tooltipEl"
    class="tooltip-item"
    :text="text"
    :target="targetElementRef"
  />
</template>
