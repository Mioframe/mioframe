import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderDocumentViewportStoryHarness from './ReorderDocumentViewportStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderDocumentViewportStoryHarness',
  component: ReorderDocumentViewportStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderDocumentViewportStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A dedicated fixture proving the full autoscroll fallback chain: the reorder container's own
 * overflow, its scrollable ancestor's overflow, and the real document viewport, each with
 * independent scroll room. No screenshot coverage applies here; the library owns no visual
 * contract.
 */
export const Default: Story = {};
