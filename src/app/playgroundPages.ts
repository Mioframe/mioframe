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
    name: 'PlainTooltip',
    component: () => import('@shared/ui/Tooltips/MDPlainTooltipPlayground.vue'),
  },
  {
    name: 'IconButton',
    component: () => import('@shared/ui/Button/MDIconButtonPlayground.vue'),
  },
  {
    name: 'Menu',
    component: () => import('@shared/ui/Menu/MDMenuPlayground.vue'),
  },
  {
    name: 'UseSortable',
    component: () => import('@shared/lib/sortable/UseSortablePlayground.vue'),
  },
  {
    name: 'Checkbox',
    component: () => import('@shared/ui/Checkbox/MDCheckboxPlayground.vue'),
  },
  {
    name: 'FAB',
    component: () => import('@shared/ui/Button/MDFabPlayground.vue'),
  },
  {
    name: 'Toolbar',
    component: () => import('@shared/ui/Toolbar/MDToolbarPlayground.vue'),
  },
  {
    name: 'BottomSheet',
    component: () => import('@shared/ui/Sheets/MDBottomSheetPlayground.vue'),
  },
  {
    name: 'BottomSheet2',
    component: () => import('@shared/ui/Sheets/MDBottomSheetPlayground2.vue'),
  },
  {
    name: 'BackNavigation',
    component: () =>
      import('@shared/lib/onBackNavigation/BackNavigationPlayground.vue'),
  },
  {
    name: 'TeleportContainer',
    component: () =>
      import('@shared/lib/teleportContainer/TeleportContainerPlayground.vue'),
  },
  {
    name: 'MDNavigationRail',
    component: () =>
      import('@shared/ui/Navigation/rail/MDNavigationRailPlayground.vue'),
  },
  {
    name: 'MDNavigationBar',
    component: () =>
      import('@shared/ui/Navigation/bar/MDNavigationBarPlayground.vue'),
  },
  {
    name: 'Query',
    component: () => import('@shared/ui/Query/QueryRendererPlayground.vue'),
  },
];
