import type { Ref } from 'vue';
import { shallowReactive, watch } from 'vue';

const loadedSymbols = shallowReactive(new Set<string>());

/**
 * Storybook-only icon loader stub that marks requested symbols as ready immediately.
 * @returns Icon loader hooks that keep Storybook stories deterministic.
 */
export const useIconStates = () => {
  const useLoadSymbol = (name: Ref<string>) => {
    watch(
      name,
      (nextName) => {
        if (nextName) {
          loadedSymbols.add(nextName);
        }
      },
      { immediate: true },
    );
  };

  return {
    useLoadSymbol,
    loadedSymbols,
  };
};
