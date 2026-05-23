import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDExtendedFab from './MDExtendedFab.vue';

const meta = {
  title: 'shared/ui/MDExtendedFab',
  component: MDExtendedFab,
  args: {
    tooltip: 'Add document',
    label: 'Add',
    color: 'primary',
    mdSymbol: 'add',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDExtendedFab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-states" class="visual-surface">
        <div class="visual-row">
          <MDExtendedFab tooltip="Add document" label="Add" color="primary" md-symbol="add" />
          <MDExtendedFab tooltip="Share selection" label="Share" color="secondary" md-symbol="share" />
          <MDExtendedFab tooltip="Archive item" label="Archive" color="tonal-primary" md-symbol="archive" />
        </div>
      </div>
    `,
  }),
};
