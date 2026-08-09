import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { StorybookRouterParameters } from '../../../../.storybook/router/routerHarness';
import RouterHarnessRegressionStory from './RouterHarnessRegressionStory.vue';

/**
 * Demonstrates and proves the Storybook-owned router harness contract
 * (docs/testing/storybook.md "Vue Router inside stories"): a story-declared deterministic
 * initial location with path/query/hash/params, `RouterLink`, `useRoute`, `useRouter`,
 * push/back/forward, and isolation from other stories. Behavior proof lives at
 * tests/e2e/storybook/routerHarness.spec.ts (this is Storybook-wide routing infrastructure
 * with no single FSD/Material owner, matching the existing overlay/reorder infra fixtures).
 */
const routerParameters: StorybookRouterParameters = {
  routes: [
    { path: '/', name: 'router-harness-root', component: { render: () => null } },
    { path: '/detail/:id', name: 'router-harness-detail', component: { render: () => null } },
  ],
  initialLocation: '/detail/42?tab=overview#top',
};

const meta = {
  title: 'shared/lib/router/RouterHarnessRegression',
  component: RouterHarnessRegressionStory,
  parameters: {
    layout: 'centered',
    router: routerParameters,
  },
} satisfies Meta<typeof RouterHarnessRegressionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
