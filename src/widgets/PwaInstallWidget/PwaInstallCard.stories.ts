import type { Meta, StoryObj } from '@storybook/vue3-vite';
import PwaInstallCard from './PwaInstallCard.vue';

const meta = {
  title: 'widgets/PwaInstallWidget/PwaInstallCard',
  component: PwaInstallCard,
  args: {
    hasRetainedPrompt: false,
  },
  argTypes: {
    onInstall: { action: 'install' },
    onLater: { action: 'later' },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PwaInstallCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithInstallPrompt: Story = {
  tags: ['visual'],
  args: { hasRetainedPrompt: true },
};

export const WithoutInstallPrompt: Story = {
  tags: ['visual'],
  args: { hasRetainedPrompt: false },
};
