import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDChipInteractionStatesStory from './MDChipInteractionStatesStory.vue';
import MDChipVisualStatesStory from './MDChipVisualStatesStory.vue';

const meta = {
  title: 'shared/ui/MDChip',
  args: {
    label: 'Chip label',
    type: 'assist',
  },
  argTypes: {
    onClick: { action: 'click' },
    onClickClose: { action: 'clickClose' },
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
    components: { MDChipVisualStatesStory },
    template: '<MDChipVisualStatesStory />',
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDChipInteractionStatesStory },
    template: '<MDChipInteractionStatesStory />',
  }),
};
