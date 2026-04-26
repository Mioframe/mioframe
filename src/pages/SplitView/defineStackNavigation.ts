import { generateId } from '@shared/lib/generateId';
import type { LocationQueryRaw } from 'vue-router';
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router';
import { z } from 'zod/v4-mini';
import type { Pane } from './definePane';
import type { Component, ComputedRef } from 'vue';
import { computed } from 'vue';
import type { UnknownRecord } from 'type-fest';
import { isNotNil } from 'es-toolkit';
import SplitView from './SplitView.vue';
import { usePaneContext } from '@shared/ui/Layout';

const rootNavigationName = generateId('StackNavigation');

const zodPropertyKey = z.union([z.string(), z.number(), z.symbol()]);

const zodPaneQuery = z.record(zodPropertyKey, z.unknown());

const PARAM_NAME = 'p' as const;

const zodQuery = z.object({
  [PARAM_NAME]: z.array(z.union([zodPaneQuery, z.undefined()])),
});

type Query = z.output<typeof zodQuery>;

type PaneMap = Record<string, Pane>;

/**
 * Options for controlling navigation stack behavior.
 *
 * Defines how panes are added, replaced, or positioned within the navigation stack.
 */
interface OpenOptions {
  /**
   * Maximum number of additional panes to allow in the stack.
   *
   * When set, the navigation stack will be truncated to this number plus one (the current pane).
   * Useful for limiting concurrent open panes in a tab-like interface.
   *
   * @default 1 (allows one additional pane)
   * @example
   * // Allow up to 2 panes total
   * await navigation.open('settings', {}, { additionalPanes: 1 });
   *
   * @example
   * // Allow up to 5 panes total
   * await navigation.open('documents', {}, { additionalPanes: 4 });
   */
  additionalPanes?: number;

  /**
   * Whether to replace the current route instead of navigating to a new one.
   *
   * When true, the browser history won't be updated and the back button
   * won't navigate away from this state. Useful for modal-like behavior.
   *
   * @default false
   * @example
   * // Open settings without adding to history
   * await navigation.open('settings', {}, { replace: true });
   */
  replace?: boolean;

  /**
   * Position where the new pane should be inserted in the stack.
   *
   * - 'add': Prepend to the beginning of the stack (new top-level pane)
   * - 'current': Replace the currently active pane
   * - number: Insert at the specified index (0-based)
   *
   * @default 'current'
   * @example
   * // Open as a new top-level pane
   * await navigation.open('documents', {}, { target: 'add' });
   *
   * @example
   * // Replace the current pane
   * await navigation.open('settings', {}, { target: 'current' });
   *
   * @example
   * // Insert at index 0 (front of stack)
   * await navigation.open('notifications', {}, { target: 0 });
   */
  target?: string;
}

export interface UseStackNavigationReturn<P extends PaneMap> {
  /**
   * Open a pane in the navigation stack.
   *
   * Navigates to the specified pane, optionally replacing or adding to the current stack.
   * Props are serialized into the URL query string for state persistence.
   *
   * @template K - The pane name key (must be a string key of P)
   * @param name - The pane name to open
   * @param props - Props to pass to the pane, parsed by the pane's model schema
   * @param options - Optional configuration for navigation behavior
   * @returns Promise that resolves when navigation completes
   * @example
   * // Open default pane
   * await navigation.open('documents');
   *
   * @example
   * // Open with props - props are serialized to query string
   * await navigation.open('documents', { filter: 'active', sort: 'name' });
   *
   * @example
   * // Open as new top-level pane
   * await navigation.open('documents', {}, { target: 'add' });
   *
   * @example
   * // Open with limit on total panes
   * await navigation.open('settings', {}, { additionalPanes: 1 });
   *
   * @example
   * // Replace current pane instead of adding to stack
   * await navigation.open('settings', {}, { target: 'current' });
   */
  open: <K extends Extract<keyof P, string>>(
    name: K,
    props: ReturnType<NonNullable<P[K]>['parseProps']>,
    options?: OpenOptions,
  ) => Promise<void>;

  /**
   * Computed reference to the currently active panes and their props.
   *
   * Returns an array of pane metadata objects, each containing:
   * - `name`: The pane identifier
   * - `component`: The Vue component to render
   * - `props`: Parsed props from the URL query string
   *
   * This is reactive and updates when the navigation stack changes.
   *
   * @example
   * // Iterate over active panes
   * for (const pane of navigation.panesComponents.value) {
   *   console.log(`${pane.name}: ${pane.component.name}`);
   * }
   */
  panesComponents: ComputedRef<
    {
      name: string;
      component: Component;
      props: UnknownRecord;
    }[]
  >;

  back: () => void;
}

export interface StackNavigation<P extends PaneMap> {
  useStackNavigation: () => UseStackNavigationReturn<P>;
  setupStackNavigation: (router: { addRoute: (route: RouteRecordRaw) => void }) => void;
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
  const setupStackNavigation = ({ addRoute }: { addRoute: (route: RouteRecordRaw) => void }) => {
    const cleanPath = rootPath?.replace(/\/+/g, '/').replace(/^\/|\/$/g, '') || '';
    const prefixPath = cleanPath ? `/${cleanPath}` : '';

    addRoute({
      name: rootNavigationName,
      path: `${prefixPath}/:${PARAM_NAME}+`,
      component: SplitView,
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
      const { data: { [PARAM_NAME]: queryList = [] } = {} } = zodQuery.safeParse(route.query);

      return queryList;
    });

    const currentPanesName = computed(() => {
      const { data } = z.object({ [PARAM_NAME]: z.array(z.string()) }).safeParse(route.params);

      return data?.[PARAM_NAME] ?? [defaultPane];
    });

    const paneCtx = usePaneContext();

    const open = async <K extends Extract<keyof P, string>>(
      name: K,
      props: ReturnType<P[K]['parseProps']>,
      { additionalPanes = 1, replace = false, target = 'current' }: OpenOptions = {},
    ): Promise<void> => {
      const maxPanes = additionalPanes + 1;

      const currentPaneIndex = paneCtx?.value.index ?? -1;

      const targetPaneIndex =
        target === 'current' ? currentPaneIndex : currentPanesName.value.indexOf(target);

      const startIndex = Math.max(targetPaneIndex, 0);

      const deleteCount = targetPaneIndex >= 0 ? 1 : 0;

      const panesName = currentPanesName.value
        .toSpliced(startIndex, deleteCount, name)
        .slice(0, maxPanes);

      const params = {
        [PARAM_NAME]: panesName,
      };

      const panesQuery = currentPanesQuery.value
        .toSpliced(startIndex, deleteCount, props)
        .slice(0, maxPanes);

      const query = {
        [PARAM_NAME]: panesQuery,
      } satisfies Query;

      await router.push({
        name: rootNavigationName,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- query-string converts JSON objects
        query: query as unknown as LocationQueryRaw,
        params,
        replace,
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
      back: () => {
        router.back();
      },
    };
  };

  return {
    useStackNavigation,
    setupStackNavigation,
  };
};
