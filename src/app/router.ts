import { MainView } from '@widget/MainViewV2';
import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

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

export const router = createRouter({
  history: createWebHistory(
    import.meta.env.PROD ? window.location.pathname : undefined,
  ),
  routes,
});
