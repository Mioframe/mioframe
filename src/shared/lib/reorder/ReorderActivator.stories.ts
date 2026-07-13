import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderActivatorStoryHarness from './ReorderActivatorStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderActivatorStoryHarness',
  component: ReorderActivatorStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderActivatorStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A manual behavior harness for `vReorderActivator`: a compound row shaped like a real
 * multi-action list item, with a native primary button inside the activator, a nested
 * `vReorderIgnore` veto, a separate non-activator content area, and a separate trailing native
 * button outside the activator. No screenshot coverage applies here; the library owns no visual
 * contract.
 */
export const Default: Story = {};
