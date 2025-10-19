<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useClosestParentFrame } from '../useClosestParentFrame';
import TeleportContainer from './TeleportContainer.vue';

defineSlots<{
  default: () => unknown;
}>();

const to = useClosestParentFrame();

const contentEl = useTemplateRef('contentEl');
</script>

<template>
  <div class="container">
    <TeleportContainer :to="to" :container="contentEl">
      <div ref="contentEl" class="content">
        <slot> empty </slot>
      </div>
    </TeleportContainer>
  </div>
</template>
