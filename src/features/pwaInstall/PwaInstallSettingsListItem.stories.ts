import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onUnmounted } from 'vue';
import { MDList } from '@shared/ui/Lists';
import PwaInstallSettingsListItem from './PwaInstallSettingsListItem.vue';
import { usePwaInstallRuntime } from './pwaInstallRuntime';

const meta = {
  title: 'features/pwaInstall/PwaInstallSettingsListItem',
  component: PwaInstallSettingsListItem,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PwaInstallSettingsListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithInstallPrompt: Story = {
  tags: ['visual'],
  render: () => ({
    setup() {
      const { retainedPrompt } = usePwaInstallRuntime();
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- BeforeInstallPromptEvent cannot be instantiated directly; structural cast is the only option in story setup
      retainedPrompt.value = {} as BeforeInstallPromptEvent;
      onUnmounted(() => {
        retainedPrompt.value = null;
      });
    },
    components: { PwaInstallSettingsListItem, MDList },
    template: '<MDList is="div"><PwaInstallSettingsListItem /></MDList>',
  }),
};

export const WithoutInstallPrompt: Story = {
  tags: ['visual'],
  render: () => ({
    setup() {
      const { retainedPrompt } = usePwaInstallRuntime();
      retainedPrompt.value = null;
    },
    components: { PwaInstallSettingsListItem, MDList },
    template: '<MDList is="div"><PwaInstallSettingsListItem /></MDList>',
  }),
};
