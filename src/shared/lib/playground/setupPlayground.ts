import type { RouteRecordRaw, Router } from 'vue-router';
import type { PlaygroundNavigationDescription, PlaygroundPage } from './types';

const playgroundPageToRoute = (
  { component, name, subPages }: PlaygroundPage,
  parentTitle?: string,
): { route: RouteRecordRaw; navigation: PlaygroundNavigationDescription } => {
  const title = parentTitle ? `${parentTitle}/${name}` : name;
  const children = subPages?.map((page) => playgroundPageToRoute(page, title));

  return {
    route: {
      path: name,
      name: title,
      component,
      meta: {
        title,
        name,
      },
      ...(children ? { children: children.map(({ route }) => route) } : {}),
    },
    navigation: {
      name,
      routeName: title,
      children: children?.map(({ navigation }) => navigation),
    },
  };
};

export const setupPlayground = (router: Router, playgroundPages: PlaygroundPage[]) => {
  const playgroundEntries = playgroundPages.map((page) => playgroundPageToRoute(page));

  router.addRoute({
    path: '/playground',
    component: () => import('./PlaygroundMain.vue'),
    meta: {
      playgroundNavigation: playgroundEntries.map(({ navigation }) => navigation),
    },
    children: playgroundEntries.map(({ route }) => route),
  });
};
