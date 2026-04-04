import type { InjectionKey } from 'vue';
import { inject, provide } from 'vue';

export type PaneContext = {
  name: string;
  index: number;
};

const KEY: InjectionKey<PaneContext> = Symbol('paneContext');

export const setupPaneContext = (ctx: PaneContext) => {
  provide(KEY, ctx);
};

export const usePaneContext = () => {
  const ctx = inject(KEY, undefined);

  return ctx;
};
