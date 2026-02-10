import { generateId } from '@shared/lib/generateId';
import type { LocationQueryRaw } from 'vue-router';
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router';
import PageView from './SplitView.vue';
import { z } from 'zod/v4-mini';
import type { Pane } from './definePane';
import type { Component, ComputedRef } from 'vue';
import { computed } from 'vue';
import type { UnknownRecord } from 'type-fest';
import { isNotNil } from 'es-toolkit';

const rootNavigationName = generateId('StackNavigation');

const zodPropertyKey = z.union([z.string(), z.number(), z.symbol()]);

const zodPaneQuery = z.record(zodPropertyKey, z.unknown());

const PARAM_NAME = 'p' as const;

const zodQuery = z.object({
  [PARAM_NAME]: z.array(zodPaneQuery),
});

type Query = z.output<typeof zodQuery>;

type PaneMap = Record<string, Pane>;

interface OpenOptions {
  /**
   * number of additional panes
   * @default 0
   */
  additionalPanes?: number;
}

export interface UseStackNavigationReturn<P extends PaneMap> {
  open: <K extends Extract<keyof P, string>>(
    name: K,
    props: ReturnType<NonNullable<P[K]>['parseProps']>,
    options?: OpenOptions,
  ) => Promise<void>;

  /**
   * panes for shows
   */
  panesComponents: ComputedRef<
    { name: string; component: Component; props: UnknownRecord }[]
  >;
}

export interface StackNavigation<P extends PaneMap> {
  useStackNavigation: () => UseStackNavigationReturn<P>;
  setupStackNavigation: (router: {
    addRoute: (route: RouteRecordRaw) => void;
  }) => void;
}

export const createStackNavigation = <P extends PaneMap>(
  panes: P,
  {
    defaultPane,
    rootPath,
  }: {
    defaultPane: Extract<keyof P, string>;
    rootPath?: string;
  },
): StackNavigation<P> => {
  const setupStackNavigation = ({
    addRoute,
  }: {
    addRoute: (route: RouteRecordRaw) => void;
  }) => {
    const cleanPath =
      rootPath?.replace(/\/+/g, '/').replace(/^\/|\/$/g, '') || '';
    const prefixPath = cleanPath ? `/${cleanPath}` : '';

    addRoute({
      name: rootNavigationName,
      path: `${prefixPath}/:${PARAM_NAME}+`,
      component: PageView,
    });

    addRoute({
      path: `${prefixPath}/:pathMatch(.*)*`,
      redirect: `${prefixPath}/${defaultPane}`,
    });
  };

  const useStackNavigation = (): UseStackNavigationReturn<P> => {
    const router = useRouter();
    const route = useRoute();

    const currentPanesQuery = computed(() => {
      const { data: { [PARAM_NAME]: queryList = [] } = {} } =
        zodQuery.safeParse(route.query);

      return queryList;
    });

    const currentPanesName = computed(() => {
      const { data } = z
        .object({ [PARAM_NAME]: z.array(z.string()) })
        .safeParse(route.params);

      return data?.[PARAM_NAME] ?? [];
    });

    const open = async <K extends Extract<keyof P, string>>(
      name: K,
      props: ReturnType<P[K]['parseProps']>,
      { additionalPanes = 0 }: OpenOptions = {},
    ): Promise<void> => {
      const maxPanes = additionalPanes + 1;

      const panesName = currentPanesName.value
        .slice(0, maxPanes)
        .filter(isNotNil);

      const paneIndex = panesName.indexOf(name);

      const params = {
        [PARAM_NAME]: panesName.toSpliced(
          paneIndex < 0 ? 0 : paneIndex,
          paneIndex < 0 ? 0 : 1,
          name,
        ),
      };

      if (params[PARAM_NAME].length > maxPanes) {
        params[PARAM_NAME].length = maxPanes;
      }

      const panesQuery = currentPanesQuery.value
        .slice(0, maxPanes)
        .filter(isNotNil);

      const query = {
        [PARAM_NAME]: panesQuery.toSpliced(
          paneIndex < 0 ? 0 : paneIndex,
          paneIndex < 0 ? 0 : 1,
          props,
        ),
      } satisfies Query;

      if (query[PARAM_NAME].length > maxPanes) {
        query[PARAM_NAME].length = maxPanes;
      }

      await router.push({
        name: rootNavigationName,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- query-string converts JSON objects
        query: query as unknown as LocationQueryRaw,
        params,
      });
    };

    const panesComponents = computed(() => {
      return currentPanesName.value
        .map((name, index) => {
          const propsQuery = currentPanesQuery.value[index] ?? {};

          const { component, parseProps } = panes[name] ?? {};

          if (component) {
            return {
              name,
              component,
              props: parseProps?.(propsQuery) ?? {},
            };
          }

          return undefined;
        })
        .filter(isNotNil);
    });

    return {
      open,
      panesComponents,
    };
  };

  return {
    useStackNavigation,
    setupStackNavigation,
  };
};
