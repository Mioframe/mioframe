import { pageToRouteRecord, type Page } from '@page/SplitView/defineSplitPage';
import type { UnionToIntersection, UnknownRecord } from 'type-fest';
import type { Router } from 'vue-router';
import {
  useRouter,
  type LocationQueryRaw,
  type RouteRecordRaw,
} from 'vue-router';
import type { InferPaneQuery, Pane } from '@page/SplitView/definePane';

type InferPageQuery<P extends Page> = P['panes'][keyof P['panes']] extends Pane
  ? InferPaneQuery<P['panes'][keyof P['panes']]>
  : never;

export interface UseMainRouterReturn<M extends PageMap> {
  open: <N extends Extract<keyof M, string>>(
    name: N,
    query: UnionToIntersection<InferPageQuery<M[N]>>,
    replace?: boolean,
  ) => Promise<void>;
}

export type UseMainRouter<M extends PageMap> = () => UseMainRouterReturn<M>;

interface CreateMainRouterReturn<M extends PageMap> {
  useMainRouter: UseMainRouter<M>;

  setupMainRouter: ({
    addRoute,
  }: {
    addRoute: (route: RouteRecordRaw) => void;
  }) => void;
}

type PageMap<P extends Page = Page> = {
  [K: string]: P;
};

export const createSplitViewRouter = <M extends PageMap>(
  pages: M,
  defaultRedirect: Extract<keyof M, string>,
): CreateMainRouterReturn<M> => {
  const MAIN_NAME = 'MAIN_NAME';

  const children: RouteRecordRaw[] = [];

  for (const key in pages) {
    if (!Object.hasOwn(pages, key)) continue;

    const { panes }: Page = pages[key];

    children.push(pageToRouteRecord(key, panes));
  }

  children.push(
    {
      path: '',
      redirect: { name: defaultRedirect },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: defaultRedirect },
    },
  );

  const mainViewRoute: RouteRecordRaw = {
    name: MAIN_NAME,
    path: '/',
    component: () => import('./SplitView.vue'),
    children,
  };

  const open = async (
    router: Router,
    name: string,
    query?: UnknownRecord,
    replace = false,
  ) => {
    await router.push({
      name,
      query: query as LocationQueryRaw,
      replace,
    });
  };

  const setup = ({
    addRoute,
  }: {
    addRoute: (route: RouteRecordRaw) => void;
  }) => {
    addRoute(mainViewRoute);
  };

  const use = (): UseMainRouterReturn<M> => {
    const router = useRouter();

    return {
      open: (name, query) => open(router, name, query),
    };
  };

  return {
    useMainRouter: use,
    setupMainRouter: setup,
  };
};
