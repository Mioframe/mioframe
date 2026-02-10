import { definePane } from '@page/SplitView/definePane';
import { zodQuery } from './model';
import RepoExplorerPane from './RepoExplorerPane.vue';

export const repoExplorerPane = definePane({
  component: RepoExplorerPane,
  zodQuery,
});
