import { MainView } from '@widget/MainViewV2';
import type { LocationQueryRaw, RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import qs from 'query-string';

const routes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'main',
    component: MainView,
  },
];

if (import.meta.env.DEV) {
  /**
   * ⚠️ deprecated - use playground
   */
  routes.push({
    path: '/ui',
    children: [
      {
        path: 'layers',
        component: () => import('@shared/ui/Layers/DemoPage.vue'),
      },
      {
        path: 'progress-indicators',
        component: () => import('@shared/ui/ProgressIndicators/DemoPage.vue'),
      },
      {
        path: 'state',
        component: () => import('@shared/ui/State/DemoPage.vue'),
      },
    ],
  });
}

const queryStringOptions: qs.ParseOptions | qs.StringifyOptions = {
  arrayFormat: 'index',
  parseBooleans: true,
  parseNumbers: true,
  skipNull: true,
};

export const router = createRouter({
  history: createWebHistory(
    import.meta.env.PROD ? window.location.pathname : undefined,
  ),
  routes,
  parseQuery: (search: string) => qs.parse(search, queryStringOptions),
  stringifyQuery: (query: LocationQueryRaw) =>
    qs.stringify(query, queryStringOptions),
});
