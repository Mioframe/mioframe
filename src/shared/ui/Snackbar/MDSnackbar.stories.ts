import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDSnackbar from './MDSnackbar.vue';

const meta = {
  title: 'shared/ui/Snackbar/MDSnackbar',
  component: MDSnackbar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MDSnackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActionColorOwnership: Story = {
  tags: ['visual'],
  args: {
    text: 'Document saved',
    actionLabel: 'Undo',
  },
  render: (args) => ({
    components: { MDSnackbar },
    setup: () => ({ args }),
    template: '<div data-testid="snackbar-color-ownership"><MDSnackbar v-bind="args" /></div>',
  }),
};
