import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDExtendedFab from './MDExtendedFab.vue';

const meta = {
  title: 'Material 3/Components/Extended FAB',
  component: MDExtendedFab,
  args: {
    label: 'Add',
    mdSymbol: 'add',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Checked against Material 3 `components/extended-fab/guidelines` and `components/extended-fab/specs`.',
      },
    },
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
          <MDExtendedFab label="Add" md-symbol="add" />
          <MDExtendedFab label="Share" color="tonal-secondary" md-symbol="share" />
          <MDExtendedFab label="Archive" color="primary" md-symbol="archive" />
        </div>
      </div>
    `,
  }),
};
