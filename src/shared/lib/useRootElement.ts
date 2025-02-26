import type { App, InjectionKey, ShallowRef } from 'vue';
import { inject, shallowRef } from 'vue';

const rootMountElementSymbol: InjectionKey<ShallowRef<Element>> =
  Symbol('rootMountElement');

export const setupRootElement = (app: App, element: Element) => {
  const el = shallowRef(element);
  app.provide(rootMountElementSymbol, el);
};

export const useRootElement = () => {
  const rootMountElement = inject(rootMountElementSymbol);

  if (!rootMountElement) {
    throw new Error('useRootElement must be used inside setupRootElement');
  }

  return rootMountElement;
};
