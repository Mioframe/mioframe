import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@widget/MainViewV2/MainView.vue'),
  },
];

if (import.meta.env.DEV) {
  /**
   * ⚠️ deprecated - use histoire
   */
  routes.push({
    path: '/ui',
    children: [
      {
        path: 'layers',
        component: () => import('@shared/ui/Layers/DemoPage.vue'),
      },
      {
        path: 'tooltips',
        component: () => import('@shared/ui/Tooltips/DemoPage.vue'),
      },
      {
        path: 'text-field',
        component: () => import('@shared/ui/TextField/DemoPage.vue'),
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
  history: createWebHistory(),
  routes,
});
