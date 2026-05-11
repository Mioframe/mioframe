import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDFab from './MDFab.vue';

const meta = {
  title: 'shared/ui/MDFab',
  component: MDFab,
  tags: ['visual'],
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
    template: `
      <div data-testid="visual-md-fab-states" class="visual-surface">
        <div class="visual-row">
          <MDFab tooltip="Primary" color="primary" md-symbol="add" />
          <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
          <MDFab tooltip="Tonal" color="tonal-primary" md-symbol="check" />
        </div>
        <div class="visual-row">
          <MDFab tooltip="Medium" size="medium" md-symbol="star" />
          <MDFab tooltip="Large" size="large" md-symbol="menu" />
          <MDFab tooltip="Loading" color="tertiary" :loading="true" />
        </div>
      </div>
    `,
  }),
};
