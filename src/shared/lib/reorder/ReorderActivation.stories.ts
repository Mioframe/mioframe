import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderActivationStoryHarness from './ReorderActivationStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderActivationStoryHarness',
  component: ReorderActivationStoryHarness,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ReorderActivationStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Browser-only fixture for controlled duplicate rejection and recovery through public controls. */
export const Default: Story = {};
