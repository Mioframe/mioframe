import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDListItemInteractionStatesStory from './MDListItemInteractionStatesStory.vue';
import MDListItemVisualStatesStory from './MDListItemVisualStatesStory.vue';

const meta = {
  title: 'shared/ui/MDListItem',
  args: {
    headline: 'List item',
    supportingText: 'Supporting text',
  },
  argTypes: {
    onClick: { action: 'click' },
    onKeydown: { action: 'keydown' },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemVisualStatesStory },
    template: '<MDListItemVisualStatesStory />',
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemInteractionStatesStory },
    template: '<MDListItemInteractionStatesStory />',
  }),
};
