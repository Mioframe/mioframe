import { documentViewPane } from './DocumentViewPane';
import { homePane } from './HomePane';
import { createSplitViewRouter, defineSplitPage } from './SplitView';
import { repoExplorerPane } from './RepoExplorer';
import { settingsPane as settingsPane } from './Settings';
import { accountPane } from './Account';
import { createStackNavigation } from './SplitView/defineStackNavigation';

export const {
  /**
   * @deprecate
   */
  setupMainRouter,
  /**
   * @deprecate
   */
  useMainRouter1,
} = createSplitViewRouter(
  {
    home: defineSplitPage({
      main: homePane,
    }),
    repo: defineSplitPage({
      main: repoExplorerPane,
      second: homePane,
    }),
    document: defineSplitPage({
      main: documentViewPane,
      second: repoExplorerPane,
    }),
    settings: defineSplitPage({
      main: settingsPane,
      second: homePane,
    }),
    accounts: defineSplitPage({
      main: accountPane,
      second: homePane,
    }),
  },
  'home',
);

export const { setupStackNavigation, useStackNavigation } =
  createStackNavigation('stack-view', {
    home: homePane,
    repo: repoExplorerPane,
    document: documentViewPane,
    settings: settingsPane,
    accounts: accountPane,
  });

export const useMainRouter = useStackNavigation;
