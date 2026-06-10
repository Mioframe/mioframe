import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MDListContainer } from '@shared/ui/Lists';
import PwaInstallSettingsListItem from './PwaInstallSettingsListItem.vue';

const meta = {
  title: 'widgets/SettingsSections/PwaInstallSettingsListItem',
  component: PwaInstallSettingsListItem,
  args: {
    hasRetainedPrompt: false,
  },
  argTypes: {
    onInstall: { action: 'install' },
  },
  parameters: {
    layout: 'padded',
  },
  decorators: [
    () => ({
      components: { MDListContainer },
      template: '<MDListContainer is="div"><story /></MDListContainer>',
    }),
  ],
} satisfies Meta<typeof PwaInstallSettingsListItem>;

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
