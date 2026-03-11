import { ref, computed, type Ref } from 'vue';

/**
 * Lazy-loading reactive state with loading and error states.
 *
 * Creates reactive state that loads data on first access. The loader is only
 * called when the state is first read (lazy evaluation).
 *
 * @param loader - Async function that returns the data
 * @param initialValue - Optional initial value before loading completes
 * @returns Object with state, execute (manual trigger), error, and loading refs
 *
 * @example
 * ```ts
 * const { state, execute, error, loading } = useLazyState(() => fetchData());
 * // First access triggers: state.value // triggers loader
 * // Manual: execute() // re-fetches
 * ```
 */
export function useLazyState<T>(loader: () => Promise<T>, initialValue?: T) {
  const state = <Ref<T | undefined>>ref(initialValue);
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
