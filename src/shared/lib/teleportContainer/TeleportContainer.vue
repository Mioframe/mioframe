<script setup lang="ts">
import { computed, type RendererElement } from 'vue';
import { useTeleportContainerRegistry } from './useChildTeleportContainer';
import type { MaybeElement } from '@vueuse/core';

const props = defineProps<{
  to: string | RendererElement | null | undefined;
  container: MaybeElement;
  defer?: boolean | undefined;
  disabled?: boolean | undefined;
}>();

defineSlots<{
  default: () => unknown;
}>();

useTeleportContainerRegistry(computed(() => props.container));
</script>

<template>
  <Teleport :to="to" :defer="defer" :disabled="disabled">
    <slot />
  </Teleport>
</template>
