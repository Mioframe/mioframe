import MDListItemConfigurationsStory from './MDListItemConfigurationsStory.vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDListItemConsumerPatternsStory from './MDListItemConsumerPatternsStory.vue';
import MDListItemDomContractStory from './MDListItemDomContractStory.vue';
import MDListItemInteractionStatesStory from './MDListItemInteractionStatesStory.vue';
import MDListItemSelectionStory from './MDListItemSelectionStory.vue';
import MDListItemSurfaceStory from './MDListItemSurfaceStory.vue';
import MDListItemTrailingActionVisualStory from './MDListItemTrailingActionVisualStory.vue';
import MDListItemVisualStatesStory from './MDListItemVisualStatesStory.vue';

const meta = {
  title: 'Material 3/Components/Lists/MDListItem',
  args: {
    labelText: 'List item',
    supportingText: 'Supporting text',
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

export const Configurations: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemConfigurationsStory },
    template: '<MDListItemConfigurationsStory />',
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemInteractionStatesStory },
    template: '<MDListItemInteractionStatesStory />',
  }),
};

export const TrailingActionLayout: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemTrailingActionVisualStory },
    template: '<MDListItemTrailingActionVisualStory />',
  }),
};

export const SelectionModes: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemSelectionStory },
    template: '<MDListItemSelectionStory />',
  }),
};

export const DomContract: Story = {
  render: () => ({
    components: { MDListItemDomContractStory },
    template: '<MDListItemDomContractStory />',
  }),
};

export const SurfaceContext: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemSurfaceStory },
    template: '<MDListItemSurfaceStory />',
  }),
};

export const ConsumerPatterns: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemConsumerPatternsStory },
    template: '<MDListItemConsumerPatternsStory />',
  }),
};
