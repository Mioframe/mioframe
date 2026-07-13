import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderProfilingHarness from './ReorderProfilingHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderProfilingHarness',
  component: ReorderProfilingHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderProfilingHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A reproducible large-list surface for DevTools profiling during production-consumer migration,
 * not a CI performance benchmark: no timing assertions apply here, and this story carries no
 * screenshot coverage.
 */
export const Items100: Story = {
  args: { itemCount: 100 },
};

/** Same profiling surface at 500 items. */
export const Items500: Story = {
  args: { itemCount: 500 },
};

/** Same profiling surface at 1000 items. */
export const Items1000: Story = {
  args: { itemCount: 1000 },
};
