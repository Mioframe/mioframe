import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDMenuLifecycleRegressionStory from './stories/MDMenuLifecycleRegressionStory.vue';

const meta = {
  title: 'shared/ui/MDMenuBase',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Real, persistent `MDMenuBase` instance with a nested teleported menu and an
 * outside control, used by Playwright to verify the shared overlay outside-
 * interaction lifecycle: reopen-after-close safety, teleported-child
 * containment, and idempotent close behavior. Not a screenshot target.
 */
export const LifecycleRegression: Story = {
  render: () => ({
    components: { MDMenuLifecycleRegressionStory },
    template: '<MDMenuLifecycleRegressionStory />',
  }),
};
