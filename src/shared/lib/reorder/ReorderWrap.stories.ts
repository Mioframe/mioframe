import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderWrapStoryHarness from './ReorderWrapStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderWrapStoryHarness',
  component: ReorderWrapStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderWrapStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A narrow flex-wrap container with mixed-size items, used by Playwright to verify
 * `ReorderSurface` supports non-linear layouts: a drag can move an item across rows in either
 * direction, and the dragged item stays bounded by its direct parent container regardless of
 * layout direction. No screenshot coverage applies here; the library owns no visual contract.
 */
export const Default: Story = {};
