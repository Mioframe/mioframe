import { ref, computed, type Ref } from 'vue';

export function useLazyState<T>(loader: () => Promise<T>, initialValue?: T) {
  const state = <Ref<T | undefined>>ref(initialValue);
  const triggered = false;
  const loading = ref(false);
  const error = ref<unknown>();

  const execute = async () => {
    try {
      error.value = undefined;
      loading.value = true;
      const result = await loader();
      state.value = result;
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  };

  const lazyState = computed({
    get(): T | undefined {
      void execute();
      return state.value;
    },
    set(newValue: T | undefined) {
      state.value = newValue;
    },
  });

  return {
    state: lazyState,
    execute,
    error: computed(() => error.value),
    loading: computed(() => loading.value),
  };
}
