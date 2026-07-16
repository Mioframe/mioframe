import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderSelfScrollableStoryHarness from './ReorderSelfScrollableStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderSelfScrollableStoryHarness',
  component: ReorderSelfScrollableStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderSelfScrollableStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A dedicated fixture whose reorder container itself scrolls (`overflow: auto`) and sits inside
 * an outer scrollable ancestor that also has its own scroll room, used by Playwright to verify
 * visibility-first ownership between the outer surface position and inner content overflow. No
 * screenshot coverage applies here; the library owns no visual contract.
 */
export const Default: Story = {};

/** The inner reorder container begins substantially clipped below the ancestor's visible edge. */
export const ClippedByAncestor: Story = { args: { clipped: true } };
