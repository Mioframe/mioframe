import type { Meta, StoryObj } from '@storybook/vue3-vite';
import PwaInstallWidget from './PwaInstallWidget.vue';

const meta = {
  title: 'widgets/PwaInstallWidget/PwaInstallWidget',
  component: PwaInstallWidget,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PwaInstallWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['visual'],
};
