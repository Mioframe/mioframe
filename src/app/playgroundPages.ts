import type { PlaygroundPage } from '@shared/lib/playground';

export const playgroundPages: PlaygroundPage[] = [
  {
    name: 'Select',
    component: () => import('@shared/ui/Select/SelectPlayground.vue'),
  },
  {
    name: 'FieldContainer',
    component: () =>
      import('@shared/ui/TextField/MDFieldContainerPlayground.vue'),
  },
  {
    name: 'TextField',
    component: () => import('@shared/ui/TextField/MDTextFieldPlayground.vue'),
  },
  {
    name: 'Chips',
    component: () => import('@shared/ui/Chips/MDChipPlayground.vue'),
  },
  {
    name: 'RichTooltip',
    component: () => import('@shared/ui/Tooltips/MDRichTooltipPlayground.vue'),
  },
  {
    name: 'IconButton',
    component: () => import('@shared/ui/Button/MDIconButtonPlayground.vue'),
  },
  {
    name: 'Menu',
    component: () => import('@shared/ui/Menu/MDMenuPlayground.vue'),
  },
];
