import { definePane } from '@page/SplitView/definePane';
import { zodQuery } from './model';

export const repoExplorerPane = definePane(
  () => import('./RepoExplorerPane.vue'),
  zodQuery,
);
