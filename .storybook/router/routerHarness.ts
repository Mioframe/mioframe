import type { App } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { createMemoryHistory, createRouter } from 'vue-router';

/**
 * Minimal story-owned routing contract (docs/testing/storybook.md "Vue Router inside
 * stories"). A story declares only the route records and initial location its own public UI
 * contract needs; everything else (memory history, installation, teardown) is mechanical
 * harness infrastructure.
 */
export type StorybookRouterParameters = {
  /** Story-owned route records, in addition to the deterministic default `/` route. */
  routes?: RouteRecordRaw[] | undefined;
  /** Deterministic initial location (path, query, hash). Defaults to `/`. */
  initialLocation?: string | undefined;
};

const DEFAULT_ROUTE: RouteRecordRaw = {
  path: '/',
  name: 'storybook-root',
  component: { render: () => null },
};

/**
 * Install a fresh, isolated `vue-router` memory-history instance on a story's Vue app.
 * Storybook creates a new Vue app per story remount (see `@storybook/vue3`'s
 * `renderToCanvas`), and this is registered through `setup()`, which runs once per remount —
 * so every story gets its own router instance and no route/history state can leak between
 * stories. Overlay primitives (Menu, Sheets, Tooltips) that only need back-navigation
 * continue to work through the deterministic default `/` route when a story declares no
 * `parameters.router`.
 * @param app - The Vue app Storybook created for the current story render.
 * @param parameters - The current story's resolved `parameters.router`, if any.
 */
export async function installStorybookRouter(
  app: App,
  parameters: StorybookRouterParameters = {},
): Promise<void> {
  const storyRoutes = parameters.routes ?? [];
  const hasRootRoute = storyRoutes.some((route) => route.path === '/');
  const router = createRouter({
    history: createMemoryHistory(),
    routes: hasRootRoute ? storyRoutes : [DEFAULT_ROUTE, ...storyRoutes],
  });

  app.use(router);

  if (parameters.initialLocation) {
    await router.push(parameters.initialLocation);
  }

  await router.isReady();
}
