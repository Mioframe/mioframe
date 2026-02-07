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

export interface UseStackNavigationReturn<P extends PaneMap> {
  open: <K extends Extract<keyof P, string>>(
    name: K,
    props: ReturnType<NonNullable<P[K]>['parseProps']>,
  ) => Promise<void>;
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
  rootPath: string,
  panes: P,
): StackNavigation<P> => {
  const setupStackNavigation = ({
    addRoute,
  }: {
    addRoute: (route: RouteRecordRaw) => void;
  }) => {
    const path = `/${rootPath}/:${PARAM_NAME}+`;

    addRoute({
      name: rootNavigationName,
      path,
      component: PageView,
    });
  };

  const useStackNavigation = (): UseStackNavigationReturn<P> => {
    const router = useRouter();
    const route = useRoute();

    const panesQuery = computed(() => {
      const { data: { [PARAM_NAME]: queryList = [] } = {} } =
        zodQuery.safeParse(route.query);

      return queryList;
    });

    const currentPanes = computed(() => {
      const { data } = z
        .object({ [PARAM_NAME]: z.array(z.string()) })
        .safeParse(route.params);

      return data?.[PARAM_NAME] ?? [];
    });

    const open = async <K extends Extract<keyof P, string>>(
      name: K,
      props: ReturnType<P[K]['parseProps']>,
    ): Promise<void> => {
      const maxPane = 2;

      const paneIndex = currentPanes.value.indexOf(name);

      const params = {
        [PARAM_NAME]: currentPanes.value.toSpliced(
          paneIndex < 0 ? 0 : paneIndex,
          paneIndex < 0 ? 0 : 1,
          name,
        ),
      };

      if (params[PARAM_NAME].length > maxPane) {
        params[PARAM_NAME].length = maxPane;
      }

      const query = {
        [PARAM_NAME]: panesQuery.value.toSpliced(
          paneIndex < 0 ? 0 : paneIndex,
          paneIndex < 0 ? 0 : 1,
          props,
        ),
      } satisfies Query;

      if (query[PARAM_NAME].length > maxPane) {
        query[PARAM_NAME].length = maxPane;
      }

      await router.push({
        name: rootNavigationName,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- query-string converts JSON objects
        query: query as unknown as LocationQueryRaw,
        params,
      });
    };

    const panesComponents = computed(() => {
      return currentPanes.value
        .map((name, index) => {
          const propsQuery = panesQuery.value[index] ?? {};

          const { component, parseProps } = panes[name] ?? {};

          if (component) {
            return {
              name,
              component,
              props: parseProps?.({ query: propsQuery }) ?? {},
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
