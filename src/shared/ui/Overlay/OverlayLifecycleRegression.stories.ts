import type { Meta, StoryObj } from '@storybook/vue3-vite';
import OverlayLifecycleRegressionStory from './stories/OverlayLifecycleRegressionStory.vue';

const meta = {
  title: 'shared/ui/Overlay',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Real, persistent `MDMenuBase`, `MDOverlayTooltip`, and `MDRichTooltip`
 * instances, each with their own target, outside control, and counters,
 * used by Playwright to verify the shared overlay outside-interaction
 * lifecycle: reopen-after-close safety, teleported-child containment, and
 * idempotent close behavior. Not a screenshot target.
 */
export const LifecycleRegression: Story = {
  render: () => ({
    components: { OverlayLifecycleRegressionStory },
    template: '<OverlayLifecycleRegressionStory />',
  }),
};
