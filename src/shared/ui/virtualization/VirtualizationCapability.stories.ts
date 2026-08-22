import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import VirtualAxisGridFixture from './VirtualAxisGridFixture.vue';
import VirtualAxisListFixture from './VirtualAxisListFixture.vue';

const meta = {
  title: 'Shared/virtualization/VirtualizationCapability',
  component: VirtualAxisListFixture,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Deterministic fixtures proving the shared useVirtualAxis adapter before database migration: bounded mounted items at scale, dynamic vertical/horizontal measurement, stable-key remapping, deep scrollToIndex, scrollMargin/scroll padding, and two-axis composition sharing one or different scroll roots. Not production UI.',
      },
    },
  },
} satisfies Meta<typeof VirtualAxisListFixture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalScale: Story = {
  args: { orientation: 'vertical', itemCount: 10000 },
};

export const HorizontalScale: Story = {
  args: { orientation: 'horizontal', itemCount: 5000 },
};

export const RemapAndAnchor: Story = {
  args: { orientation: 'vertical', itemCount: 200 },
};

export const TwoAxesSameRoot: StoryObj = {
  render: () => ({
    components: { VirtualAxisGridFixture },
    template: '<VirtualAxisGridFixture />',
  }),
};

export const TwoAxesDifferentRoots: StoryObj = {
  render: () => ({
    components: { VirtualAxisListFixture },
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <div data-testid="two-axes-different-roots-vertical">
          <VirtualAxisListFixture orientation="vertical" :item-count="500" />
        </div>
        <div data-testid="two-axes-different-roots-horizontal">
          <VirtualAxisListFixture orientation="horizontal" :item-count="500" />
        </div>
      </div>
    `,
  }),
};

export const MountCycle: StoryObj = {
  render: () => ({
    components: { VirtualAxisListFixture },
    setup() {
      const mounted = ref(true);
      const toggle = () => {
        mounted.value = !mounted.value;
      };
      return { mounted, toggle };
    },
    template: `
      <div>
        <button type="button" data-testid="mount-cycle-toggle" @click="toggle">Toggle mount</button>
        <VirtualAxisListFixture v-if="mounted" orientation="vertical" :item-count="200" />
      </div>
    `,
  }),
};
