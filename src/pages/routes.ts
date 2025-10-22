import { documentViewPane } from './DocumentViewPane';
import { homePane } from './HomePane';
import { createSplitViewRouter, defineSplitPage } from './SplitView';
import { repoExplorerPane } from './RepoExplorer';
import { SettingsPane } from './Settings';

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
      main: SettingsPane,
      second: homePane,
    }),
  },
  'home',
);
