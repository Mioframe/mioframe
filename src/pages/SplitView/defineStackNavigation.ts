import { generateId } from '@shared/lib/generateId';
import type { LocationQueryRaw } from 'vue-router';
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router';
import StackView from './StackView.vue';
import { z } from 'zod/v4-mini';
import type { Pane } from './definePane';
import type { ComputedRef } from 'vue';
import { computed } from 'vue';
import type { UnknownRecord } from 'type-fest';
import { isNotNil } from 'es-toolkit';

const name = generateId('StackNavigation');

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
    { component: Pane['component']; props: UnknownRecord }[]
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
    addRoute({
      name,
      path: `/${rootPath}:${PARAM_NAME}(\\.+)+`,
      component: StackView,
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
      const { data: { [PARAM_NAME]: panesList = [] } = {} } = z
        .object({ [PARAM_NAME]: z.array(z.string()) })
        .safeParse(route.params);

      return panesList;
    });

    const open = async <K extends Extract<keyof P, string>>(
      name: K,
      props: ReturnType<P[K]['parseProps']>,
    ): Promise<void> => {
      const panesList = currentPanes.value.includes(name)
        ? currentPanes.value
        : [name, ...currentPanes.value];

      panesList.length = 2;

      const params = {
        [PARAM_NAME]: panesList,
      };

      const paneIndex = panesList.indexOf(name);

      const queryList = panesQuery.value.toSpliced(paneIndex, 0, props);

      const query = {
        [PARAM_NAME]: queryList,
      } satisfies Query;

      await router.push({
        name,
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
