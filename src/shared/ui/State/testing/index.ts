/**
 * Story/test-only forced visual state utilities for `MDStateLayer`. Not part
 * of the product-facing `State` public API — import from this `testing`
 * submodule explicitly, never re-export it from `../index.ts`.
 *
 * Only the component is barrelled here. `provideMDStateLayerForcedState` and
 * `useMDStateLayerForcedState` are plain functions, not components; import
 * them directly from `./forcedState` (mirroring `Lists/listContext.ts`,
 * which is not re-exported through `Lists/index.ts` either). Barrelling a
 * plain function export alongside a component here breaks the Storybook
 * vue-component-meta docgen plugin, which mis-resolves the function export.
 */
export { default as MDStateLayerForcedStateProvider } from './MDStateLayerForcedStateProvider.vue';
