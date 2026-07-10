import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderStoryHarness from './ReorderStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderStoryHarness',
  component: ReorderStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A manual behavior harness for `useReorder`: varied item sizes, a non-directional wrapping
 * arrangement, a scrollable ancestor around an already-scrollable container, a nested inner
 * scroll region, a standard interactive child, and a `vReorderIgnore` child. No screenshot
 * coverage applies here; the library owns no visual contract.
 */
export const Default: Story = {};
