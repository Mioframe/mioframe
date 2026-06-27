import { reactive, computed, watch } from 'vue';
import { createGlobalState } from '@vueuse/core';
import { sessionUniqueId } from '@shared/lib/uniqueId';

interface SnackbarState {
  snackbarQueue: Snackbar[];
}

type SnackbarDescription = {
  text: string;
  /**
   * duration of the show
   * @default 7s
   * @min 4s
   * @max 10s
   */
  timeout?: number;
  actionLabel?: string;
  callback?: () => unknown;
};

type Snackbar = SnackbarDescription & { id: string };

export const useSnackbar = createGlobalState(() => {
  const state = reactive<SnackbarState>({
    snackbarQueue: [],
  });

  const currentSnackbar = computed(() => state.snackbarQueue.at(0));

  let currentTimer: ReturnType<typeof setTimeout> | undefined;

  const removeSnackbar = (options: Snackbar) => {
    const index = state.snackbarQueue.indexOf(options);
    if (index >= 0) {
      if (index === 0) {
        clearCurrentTimer();
      }
      state.snackbarQueue.splice(index, 1);
    }
  };

  const addSnackbar = (description: SnackbarDescription) => {
    const snackbar = { ...description, id: sessionUniqueId('snackbar') };

    if (!snackbar.callback || !snackbar.actionLabel) {
      snackbar.timeout = Math.min(Math.max(snackbar.timeout ?? 7e3, 4e3), 10e3);
      delete snackbar.callback;
      delete snackbar.actionLabel;
    }

    state.snackbarQueue.push(snackbar);

    return () => {
      removeSnackbar(snackbar);
    };
  };

  const closeSnackbar = () => {
    const snackbar = currentSnackbar.value;
    if (snackbar) {
      removeSnackbar(snackbar);
    }
  };

  const clearCurrentTimer = (): void => {
    if (currentTimer) {
      clearTimeout(currentTimer);
      currentTimer = undefined;
    }
  };

  watch(
    currentSnackbar,
    (newSnackbar) => {
      clearCurrentTimer();
      if (newSnackbar && 'timeout' in newSnackbar) {
        currentTimer = setTimeout(() => {
          if (currentSnackbar.value === newSnackbar) {
            removeSnackbar(newSnackbar);
          }
        }, newSnackbar.timeout);
      }
    },
    { immediate: true },
  );

  return {
    state,
    currentSnackbar,
    addSnackbar,
    closeSnackbar,
    removeSnackbar,
  };
});
