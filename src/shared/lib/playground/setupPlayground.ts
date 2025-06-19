import type { Router } from 'vue-router';
import type { PlaygroundPage, PlaygroundRouteRecordRaw } from './types';

const playgroundPageToRoute = (
  { component, name, subPages }: PlaygroundPage,
  parentTitle?: string,
): PlaygroundRouteRecordRaw => {
  const title = parentTitle ? `${parentTitle}/${name}` : name;

  return {
    path: name,
    name: title,
    component,
    meta: {
      title,
      name,
    },
    children: subPages
      ? subPages.map((v) => playgroundPageToRoute(v, title))
      : undefined,
  };
};

export const setupPlayground = (
  router: Router,
  playgroundPages: PlaygroundPage[],
) => {
  const children = playgroundPages.map((v) => playgroundPageToRoute(v));

  router.addRoute({
    path: '/playground',
    component: () => import('./PlaygroundMain.vue'),
    meta: {
      playgroundRoutes: children,
    },
    children,
  });
};
