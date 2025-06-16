<script setup lang="ts">
import { FadeTransition } from '@noction/vue-bezier';
import MDSnackbar from './MDSnackbar.vue';
import { useSnackbar } from './useSnackbar';
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';

const { currentSnackbar, closeSnackbar } = useSnackbar();

const onClickClose = () => {
  closeSnackbar();
};

const targetTeleport = useClosestParentFrame();
</script>

<template>
  <Teleport defer :to="targetTeleport">
    <div v-if="currentSnackbar" class="snackbar-container">
      <FadeTransition group>
        <MDSnackbar
          :key="currentSnackbar.id"
          class="snackbar-container__snackbar"
          :text="currentSnackbar.text"
          :action-label="currentSnackbar.actionLabel"
          @click-action="currentSnackbar.callback"
          @click-close="onClickClose"
        />
      </FadeTransition>
    </div>
  </Teleport>
</template>

<style scoped>
.snackbar-container {
  position: fixed;
  z-index: 2;
  left: 16px;
  right: 16px;
  bottom: 16px;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;

  &__snackbar {
    pointer-events: all;
  }
}
</style>
