import { inject, provide, type InjectionKey, type Ref } from 'vue';

/**
 * Story/test-only forced visual state shape for `MDStateLayer`. Mirrors the
 * `useStateLayer` state model. Unset fields fall back to the host's real
 * runtime state, so injecting one field never masks the others.
 */
export interface MDStateLayerForcedState {
  /** Forces the hover state-layer visual on or off when set. */
  hovered?: boolean;
  /** Forces the focus state-layer visual on or off when set. */
  focused?: boolean;
  /** Forces the pressed state-layer visual on or off when set. */
  pressed?: boolean;
  /** Forces the dragged state-layer visual on or off when set. */
  dragged?: boolean;
}

type MDStateLayerForcedStateRefs = {
  [K in keyof MDStateLayerForcedState]?: Ref<MDStateLayerForcedState[K]>;
};

const MD_STATE_LAYER_FORCED_STATE_KEY: InjectionKey<MDStateLayerForcedStateRefs> =
  Symbol('MDStateLayerForcedState');

/**
 * Provides a scoped forced visual state override for every `MDStateLayer`
 * rendered in this subtree, for story/test use only. Do not call this from
 * product code.
 * @param state - Reactive per-field forced state. Unset fields are ignored.
 */
export const provideMDStateLayerForcedState = (state: MDStateLayerForcedStateRefs) => {
  provide(MD_STATE_LAYER_FORCED_STATE_KEY, state);
};

/**
 * Reads the nearest injected forced visual state, if any.
 * @returns The injected forced state refs, or `undefined` outside a provider.
 */
export const useMDStateLayerForcedState = () => inject(MD_STATE_LAYER_FORCED_STATE_KEY, undefined);
