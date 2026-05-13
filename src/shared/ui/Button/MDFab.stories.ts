import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDFab from './MDFab.vue';

const meta = {
  title: 'shared/ui/MDFab',
  component: MDFab,
  args: {
    tooltip: 'Create item',
    color: 'primary',
    mdSymbol: 'add',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDFab>;

export default meta;

type Story = StoryObj<typeof meta>;

const fabStatesTemplate = `
  <div data-testid="visual-md-fab-states" class="visual-surface">
    <div class="visual-row">
      <MDFab tooltip="Primary" color="primary" md-symbol="add" />
      <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
      <MDFab tooltip="Tonal" color="tonal-primary" md-symbol="check" />
    </div>
    <div class="visual-row">
      <MDFab tooltip="Medium" size="medium" md-symbol="star" />
      <MDFab tooltip="Large" size="large" md-symbol="menu" />
      <MDFab tooltip="Tertiary" color="tertiary" md-symbol="share" />
    </div>
  </div>
`;

const fabInteractionStatesTemplate = `
  <div data-testid="visual-md-fab-interaction-states" class="visual-surface">
    <div class="visual-row">
      <MDFab tooltip="Primary hover target" color="primary" md-symbol="add" />
      <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
      <MDFab tooltip="Tonal" color="tonal-primary" md-symbol="check" />
    </div>
    <div class="visual-row">
      <MDFab tooltip="Medium" size="medium" md-symbol="star" />
      <MDFab tooltip="Focus target" size="large" color="tertiary" md-symbol="share" />
      <MDFab tooltip="Tonal secondary" color="tonal-secondary" md-symbol="menu" />
    </div>
  </div>
`;

export const Default: Story = {};

export const Secondary: Story = {
  args: {
    color: 'secondary',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDFab },
    template: fabStatesTemplate,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDFab },
    template: fabInteractionStatesTemplate,
  }),
};
