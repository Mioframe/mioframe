<script setup lang="ts">
import { useClosestParentFrame } from '../useClosestParentFrame';
import TeleportContainer from './TeleportContainer.vue';

defineSlots<{
  default: () => unknown;
}>();

const to = useClosestParentFrame();
</script>

<template>
  <div class="container">
    <TeleportContainer :to="to">
      <div class="content">
        <slot> empty </slot>
      </div>
    </TeleportContainer>
  </div>
</template>
