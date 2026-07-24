import { aboutMioframePane } from './AboutMioframePane';
import { documentViewPane } from './DocumentViewPane';
import { dataStoragePrivacyPane } from './DataStoragePrivacyPane';
import { helpArticlePane, helpIndexPane } from './Help';
import { homePane } from './HomePane';
import { repoExplorerPane } from './RepoExplorer';
import { settingsPane } from './Settings';
import { appUpdatesPane } from './AppUpdatesPane';
import { MANAGED_APP_UPDATES_AVAILABLE } from '@shared/config';
import { createStackNavigation } from './SplitView/defineStackNavigation';
import type { RouteRecordRaw } from 'vue-router';

const rootPath = '/';

const panes = {
  home: homePane,
  repo: repoExplorerPane,
  document: documentViewPane,
  settings: settingsPane,
  dataStoragePrivacy: dataStoragePrivacyPane,
  helpIndex: helpIndexPane,
  helpArticle: helpArticlePane,
  aboutMioframe: aboutMioframePane,
  ...(MANAGED_APP_UPDATES_AVAILABLE ? { appUpdates: appUpdatesPane } : {}),
};

const { setupStackNavigation: setup, useStackNavigation: use } = createStackNavigation(panes, {
  defaultPane: 'home',
  rootPath,
});

/**
 * Registers the split-view stack navigation routes for the application shell.
 * @param router - Router registration hooks used during app bootstrap.
 */
export const setupStackNavigation = (router: { addRoute: (route: RouteRecordRaw) => void }) => {
  setup(router);

  router.addRoute({
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: {
      path: rootPath,
    },
  });
};

/**
 * Exposes reactive pane-stack navigation helpers for app pages and widgets.
 */
export const useStackNavigation = use;
