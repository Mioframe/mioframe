import type { RouteComponent } from 'vue-router';

export type PlaygroundPage = {
  name: string;
  component: () => Promise<RouteComponent>;
  subPages?: PlaygroundPage[] | undefined;
};

export type PlaygroundNavigationDescription = {
  name: string;
  routeName: string;
  children?: PlaygroundNavigationDescription[] | undefined;
};
