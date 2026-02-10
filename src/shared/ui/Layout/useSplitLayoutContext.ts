import type { InjectionKey, Ref } from 'vue';
import { inject, provide } from 'vue';

type ContextState = {
  numberOfPanes: Ref<number>;
  bodyLeft: Ref<number>;
  bodyWidth: Ref<number>;
};

const KEY: InjectionKey<ContextState> = Symbol('splitLayoutKey');

export const setupSplitLayoutContext = (state: ContextState) => {
  provide(KEY, state);
};

export const useSplitLayoutContext = () => {
  const state = inject(KEY);

  if (!state) {
    throw new Error('Split layout is not provided');
  }

  return state;
};
