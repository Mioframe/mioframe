import { aboutMioframePane } from './AboutMioframePane';
import { documentViewPane } from './DocumentViewPane';
import { dataStoragePrivacyPane } from './DataStoragePrivacyPane';
import { helpArticlePane, helpIndexPane } from './Help';
import { homePane } from './HomePane';
import { repoExplorerPane } from './RepoExplorer';
import { settingsPane } from './Settings';
import { createStackNavigation } from './SplitView/defineStackNavigation';
import type { RouteRecordRaw } from 'vue-router';

const rootPath = '/';

const { setupStackNavigation: setup, useStackNavigation: use } = createStackNavigation(
  {
    home: homePane,
    repo: repoExplorerPane,
    document: documentViewPane,
    settings: settingsPane,
    dataStoragePrivacy: dataStoragePrivacyPane,
    helpIndex: helpIndexPane,
    helpArticle: helpArticlePane,
    aboutMioframe: aboutMioframePane,
  },
  {
    defaultPane: 'home',
    rootPath,
  },
);

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
