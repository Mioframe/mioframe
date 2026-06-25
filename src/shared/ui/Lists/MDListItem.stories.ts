import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDListItemConfigurationsStory from './stories/MDListItemConfigurationsStory.vue';
import MDListItemConsumerPatternsStory from './stories/MDListItemConsumerPatternsStory.vue';
import MDListItemDomContractStory from './stories/MDListItemDomContractStory.vue';
import MDListItemInteractionStatesStory from './stories/MDListItemInteractionStatesStory.vue';
import MDListItemMaterialReferenceStory from './stories/MDListItemMaterialReferenceStory.vue';
import MDListItemSelectionStory from './stories/MDListItemSelectionStory.vue';
import MDListItemStandaloneStory from './stories/MDListItemStandaloneStory.vue';
import MDListItemSurfaceRepositoryStory from './stories/MDListItemSurfaceRepositoryStory.vue';
import MDListItemSurfaceSegmentedDiagnosticStory from './stories/MDListItemSurfaceSegmentedDiagnosticStory.vue';
import MDListItemSurfaceSegmentedStory from './stories/MDListItemSurfaceSegmentedStory.vue';
import MDListItemSurfaceStandardStory from './stories/MDListItemSurfaceStandardStory.vue';
import MDListItemTrailingActionVisualStory from './stories/MDListItemTrailingActionVisualStory.vue';
import MDListItemVisualStatesStory from './stories/MDListItemVisualStatesStory.vue';

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

export const SurfaceContextStandard: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemSurfaceStandardStory },
    template: '<MDListItemSurfaceStandardStory />',
  }),
};

export const SurfaceContextSegmented: Story = {
  name: 'Segmented Material Parity',
  tags: ['visual'],
  parameters: {
    docs: {
      description: {
        story:
          'Material parity sample. MDList stays transparent and is shown without an extra colored wrapper so segmented gaps do not read as a list-container fill.',
      },
    },
  },
  render: () => ({
    components: { MDListItemSurfaceSegmentedStory },
    template: '<MDListItemSurfaceSegmentedStory />',
  }),
};

export const SurfaceContextSegmentedDiagnostic: Story = {
  name: 'Segmented Surface Diagnostic',
  tags: ['visual'],
  parameters: {
    docs: {
      description: {
        story:
          'Diagnostic surface-context sample. The contrasting parent surface is intentional and demonstrates that transparent segmented gaps reveal the parent surface rather than an MDList background.',
      },
    },
  },
  render: () => ({
    components: { MDListItemSurfaceSegmentedDiagnosticStory },
    template: '<MDListItemSurfaceSegmentedDiagnosticStory />',
  }),
};

export const SurfaceContextRepositoryExplorer: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemSurfaceRepositoryStory },
    template: '<MDListItemSurfaceRepositoryStory />',
  }),
};

export const ConsumerPatterns: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemConsumerPatternsStory },
    template: '<MDListItemConsumerPatternsStory />',
  }),
};

export const MaterialReference: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemMaterialReferenceStory },
    template: '<MDListItemMaterialReferenceStory />',
  }),
};

export const StandalonePublicApi: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDListItemStandaloneStory },
    template: '<MDListItemStandaloneStory />',
  }),
};
