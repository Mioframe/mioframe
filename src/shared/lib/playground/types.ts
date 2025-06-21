import type { RouteComponent } from 'vue-router';

export type PlaygroundPage = {
  name: string;
  component: () => Promise<RouteComponent>;
  subPages?: PlaygroundPage[];
};

export type PlaygroundRouteRecordRaw = {
  path: string;
  name: string;
  component: RouteComponent | (() => Promise<RouteComponent>);
  meta: {
    title: string;
    name: string;
  };
  children?: PlaygroundRouteRecordRaw[];
};

export type PlaygroundNavigationDescription = {
  name: string;
  routeName: string;
  children?: PlaygroundNavigationDescription[];
};
