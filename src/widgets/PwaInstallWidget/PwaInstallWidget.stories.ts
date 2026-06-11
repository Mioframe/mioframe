import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onUnmounted } from 'vue';
import PwaInstallWidget from './PwaInstallWidget.vue';
import { usePwaInstallRuntime } from '@feature/pwaInstall/pwaInstallRuntime';

const meta = {
  title: 'widgets/PwaInstallWidget/PwaInstallWidget',
  component: PwaInstallWidget,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PwaInstallWidget>;

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
    components: { PwaInstallWidget },
    template: '<PwaInstallWidget />',
  }),
};

export const WithoutInstallPrompt: Story = {
  tags: ['visual'],
  render: () => ({
    setup() {
      const { retainedPrompt } = usePwaInstallRuntime();
      retainedPrompt.value = null;
    },
    components: { PwaInstallWidget },
    template: '<PwaInstallWidget />',
  }),
};
