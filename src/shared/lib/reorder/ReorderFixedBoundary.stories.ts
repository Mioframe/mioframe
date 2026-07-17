import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderFixedBoundaryStoryHarness from './ReorderFixedBoundaryStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderFixedBoundaryStoryHarness',
  component: ReorderFixedBoundaryStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderFixedBoundaryStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A dedicated fixture proving `getReorderScrollCandidates` does not mistake a `position: fixed`
 * element for a viewport-fixed boundary when its actual containing block is a transformed
 * ancestor: that ancestor's own scroll must still be able to participate in autoscroll. No
 * screenshot coverage applies here; the library owns no visual contract.
 */
export const Default: Story = {};
