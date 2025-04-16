<script setup lang="ts">
import { useRootElement } from '@shared/lib/useRootElement';
import MDDialog from '../MDDialog.vue';
import { useAlertState } from './useAlert';

const rootElement = useRootElement();

const { onApply, alertSet } = useAlertState();
</script>

<template>
  <Teleport :to="rootElement">
    <div class="alert-container">
      <MDDialog
        v-for="item in alertSet"
        :key="item.id"
        :headline="item.headline"
        :supporting-text="item.supportingText"
        apply-label="OK"
        class="alert-container__dialog"
        @apply="onApply(item)"
      />
    </div>
  </Teleport>
</template>

<style lang="css" scoped>
.alert-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  background: transparent;

  &__dialog {
    pointer-events: auto;
  }
}
</style>
