// Real implementation relocated to `@shared/ui/material/foundation/state` (the canonical
// Material "Interaction states" foundation). This module forwards only, so existing consumers
// outside Material keep working without a parallel implementation.
export {
  MDStateLayer,
  usePressed,
  useRipple,
  useStateLayer,
} from '@shared/ui/material/foundation/state';
