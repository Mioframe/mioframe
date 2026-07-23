// Real implementation relocated to `@shared/ui/material/foundation/state` (the canonical
// Material "Interaction states" foundation). This module forwards only, so existing consumers
// outside Material keep working without a parallel implementation.
//
// This uses import-then-local-export (not a pure `export { ... } from '...'` re-export)
// because Storybook's `vue-component-meta` docgen plugin appends
// `MDStateLayer.__docgenInfo = Object.assign(...)` to any exported name it detects as a Vue
// component, assuming a local binding exists in this module's own scope. A pure re-export
// creates no such binding, and Rollup's production build then emits a literal
// `ReferenceError: MDStateLayer is not defined`. Importing first guarantees a real local
// binding regardless of how this statement is formatted.
import {
  MDStateLayer,
  usePressed,
  useRipple,
  useStateLayer,
} from '@shared/ui/material/foundation/state';

export { MDStateLayer, usePressed, useRipple, useStateLayer };
