<script setup lang="ts">
import { useTemplateRef, type RendererElement } from 'vue';
import { useTeleportContainerRegistry } from './useChildTeleportContainer';

defineProps<{
  to: string | RendererElement | null | undefined;
  defer?: boolean | undefined;
  disabled?: boolean | undefined;
}>();

defineSlots<{
  default: () => unknown;
}>();

const teleportedContainer = useTemplateRef('teleportedContainer');

useTeleportContainerRegistry(teleportedContainer);
</script>

<template>
  <Teleport :to="to" :defer="defer" :disabled="disabled">
    <div ref="teleportedContainer">
      <slot />
    </div>
  </Teleport>
</template>
