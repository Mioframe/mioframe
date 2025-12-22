import { documentViewPane } from './DocumentViewPane';
import { homePane } from './HomePane';
import { createSplitViewRouter, defineSplitPage } from './SplitView';
import { repoExplorerPane } from './RepoExplorer';
import { SettingsPane as settingsPane } from './Settings';
import { accountPane } from './Account';

export const { setupMainRouter, useMainRouter } = createSplitViewRouter(
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
