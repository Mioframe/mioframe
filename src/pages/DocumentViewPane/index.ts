import { definePane } from '@page/SplitView/definePane';
import { zodQuery } from './model';

export const documentViewPane = definePane(
  () => import('./DocumentViewPane.vue'),
  zodQuery,
);
