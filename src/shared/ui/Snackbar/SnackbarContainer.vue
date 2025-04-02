<script setup lang="ts">
import { FadeTransition } from '@noction/vue-bezier';
import { useRootElement } from '@shared/lib/useRootElement';
import MDSnackbar from './MDSnackbar.vue';
import { useSnackbar } from './useSnackbar';

const rootEl = useRootElement();

const { currentSnackbar, closeSnackbar } = useSnackbar();

const onClickClose = () => {
  closeSnackbar();
};
</script>

<template>
  <Teleport :to="rootEl">
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
