import type { InjectionKey, Ref } from 'vue';
import { inject, provide } from 'vue';

export type PaneContext = {
  name: string;
  index: number;
};

const KEY: InjectionKey<Ref<PaneContext>> = Symbol('paneContext');

export const setupPaneContext = (ctx: Ref<PaneContext>) => {
  provide(KEY, ctx);
};

export const usePaneContext = () => {
  const ctx = inject(KEY, undefined);

  return ctx;
};
