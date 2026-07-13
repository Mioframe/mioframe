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
 * A manual behavior harness for `vReorderActivator`. Alpha/Bravo are compound rows shaped like a
 * real multi-action list item, with a native primary button inside a child-region activator, a
 * nested `vReorderIgnore` veto, a separate non-activator content area, and a separate trailing
 * native button outside the activator. Charlie is a full-row activator (`v-reorder-activator` on
 * the item root itself, matching `DatabaseViewListEdit`'s real usage), whose native trailing
 * settings control requires its own `vReorderIgnore` to stay independent. No screenshot coverage
 * applies here; the library owns no visual contract.
 */
export const Default: Story = {};
