import { documentViewPane } from './DocumentViewPane';
import { homePane } from './HomePane';
import { repoExplorerPane } from './RepoExplorer';
import { settingsPane as settingsPane } from './Settings';
import { accountPane } from './Account';
import { createStackNavigation } from './SplitView/defineStackNavigation';
import type { RouteRecordRaw } from 'vue-router';

const rootPath = '/';

const { setupStackNavigation: setup, useStackNavigation: use } =
  createStackNavigation(
    {
      home: homePane,
      repo: repoExplorerPane,
      document: documentViewPane,
      settings: settingsPane,
      accounts: accountPane,
    },
    {
      defaultPane: 'home',
      rootPath,
    },
  );

export const setupStackNavigation = ({
  addRoute,
}: {
  addRoute: (route: RouteRecordRaw) => void;
}) => {
  setup({ addRoute });

  addRoute({
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: {
      path: rootPath,
    },
  });
};

export const useStackNavigation = use;
