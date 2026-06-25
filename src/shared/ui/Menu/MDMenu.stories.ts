import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDMenuWithSubmenuStory from './stories/MDMenuWithSubmenuStory.vue';

const meta = {
  title: 'shared/ui/MDMenu',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Deterministic, fixture-driven menu surface: leading icon, label, and a nested
 * submenu item with a trailing arrow icon. Used by Playwright to verify the menu
 * surface, item rendering, and submenu positioning/focus without depending on
 * `MDListContainer` or any List-owned layout.
 */
export const WithSubmenu: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDMenuWithSubmenuStory },
    template: '<MDMenuWithSubmenuStory />',
  }),
};
