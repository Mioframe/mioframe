import {
  type RouteLocationNormalizedGeneric,
  type RouteRecordMultipleViews,
} from 'vue-router';
import type { Component } from 'vue';
import type { UnknownRecord } from 'type-fest';
import type { SPLIT_VIEW } from '@shared/ui/Layout';
import type { Pane } from '@page/SplitView/definePane';

export type Panes = {
  [SPLIT_VIEW.main]: Pane;
  [SPLIT_VIEW.second]?: Pane;
};

export interface Page<T extends Panes = Panes> {
  panes: T;
}

export const pageToRouteRecord = (name: string, panes: Panes) =>
  ({
    name,
    path: `/${name}`,
    components: Object.entries(panes).reduce(
      (
        components: Record<string, () => Promise<Component>>,
        [name, { component }],
      ) => {
        return { ...components, [name]: component };
      },
      {},
    ),
    props: Object.entries(panes).reduce(
      (
        props: Record<
          string,
          (to: RouteLocationNormalizedGeneric) => UnknownRecord | undefined
        >,
        [name, pane],
      ) => {
        return { ...props, [name]: pane.parseProps };
      },
      {},
    ),
  }) satisfies RouteRecordMultipleViews;

export const defineSplitPage = <T extends Panes>(panes: T): Page<T> => {
  return {
    panes,
  };
};
