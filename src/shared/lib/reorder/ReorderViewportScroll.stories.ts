import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderViewportScrollStoryHarness from './ReorderViewportScrollStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderViewportScrollStoryHarness',
  component: ReorderViewportScrollStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderViewportScrollStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A dedicated fixture, isolated from `ReorderStoryHarness`, whose own rendered structure and
 * story-owned CSS naturally produce a scrollable reorder container, a scrollable ancestor around
 * it, and remaining document/viewport scroll room at once — used to verify autoscroll's fallback
 * to real window scrolling once the container and its ancestor both reach their own scroll
 * limits. No screenshot coverage applies here; the library owns no visual contract.
 */
export const Default: Story = {};
