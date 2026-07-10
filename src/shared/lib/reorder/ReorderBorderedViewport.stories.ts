import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderBorderedViewportStoryHarness from './ReorderBorderedViewportStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderBorderedViewportStoryHarness',
  component: ReorderBorderedViewportStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderBorderedViewportStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A minimal harness isolating a single reorder container with a deliberately thick border, used
 * only to prove autoscroll edge detection is based on the client (content) viewport and excludes
 * the border area. No screenshot coverage applies here; the library owns no visual contract.
 */
export const Default: Story = {};
