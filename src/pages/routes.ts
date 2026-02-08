import { documentViewPane } from './DocumentViewPane';
import { homePane } from './HomePane';
import { repoExplorerPane } from './RepoExplorer';
import { settingsPane as settingsPane } from './Settings';
import { accountPane } from './Account';
import { createStackNavigation } from './SplitView/defineStackNavigation';

export const { setupStackNavigation, useStackNavigation } =
  createStackNavigation('stack-view', {
    home: homePane,
    repo: repoExplorerPane,
    document: documentViewPane,
    settings: settingsPane,
    accounts: accountPane,
  });

export const useMainRouter = useStackNavigation;
