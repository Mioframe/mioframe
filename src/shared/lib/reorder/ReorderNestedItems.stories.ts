import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReorderNestedItemsStoryHarness from './ReorderNestedItemsStoryHarness.vue';

const meta = {
  title: 'shared/lib/reorder/ReorderNestedItemsStoryHarness',
  component: ReorderNestedItemsStoryHarness,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReorderNestedItemsStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A manual behavior harness proving nested registered-item activator independence: `child` is a
 * second registered item nested inside `parent`'s own DOM subtree, and `child`'s own activator
 * must never switch the enclosing, activator-less `parent` into strict handle-only mode. No
 * screenshot coverage applies here; the library owns no visual contract.
 */
export const Default: Story = {};
