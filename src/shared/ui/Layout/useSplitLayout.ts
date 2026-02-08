import type { InjectionKey, Ref } from 'vue';
import { inject, provide } from 'vue';

type State = {
  numberOfPanes: Ref<number>;
  bodyLeft: Ref<number>;
  bodyWidth: Ref<number>;
};

const KEY: InjectionKey<State> = Symbol('splitLayoutKey');

export const setupSplitLayout = (state: State) => {
  provide(KEY, state);
};

export const useSplitLayout = () => {
  const state = inject(KEY);

  if (!state) {
    throw new Error('Split layout is not provided');
  }

  return state;
};
