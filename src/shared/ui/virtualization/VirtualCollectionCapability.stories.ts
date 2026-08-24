import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import VirtualCollectionCapabilityFixture from './VirtualCollectionCapabilityFixture.vue';

const meta = {
  title: 'Shared/virtualization/VirtualCollectionCapability',
  component: VirtualCollectionCapabilityFixture,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Deterministic fixtures proving the shared useVirtualCollection composable before database migration: bounded mounted items at scale, dynamic vertical/horizontal measurement, stable-key remapping, deep-scroll leading/trailing geometry, and unmount/remount behavior. Not production UI.',
      },
    },
  },
} satisfies Meta<typeof VirtualCollectionCapabilityFixture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalScale: Story = {
  args: { axis: 'vertical', itemCount: 10000 },
};

export const HorizontalScale: Story = {
  args: { axis: 'horizontal', itemCount: 5000 },
};

export const RemapAndDeepScroll: Story = {
  args: { axis: 'vertical', itemCount: 200 },
};

export const SurfaceOffset: Story = {
  args: { axis: 'vertical', itemCount: 10000, surfaceOffset: 240 },
};

export const DynamicSurfaceOffset: StoryObj = {
  render: () => ({
    components: { VirtualCollectionCapabilityFixture },
    setup() {
      const surfaceOffset = ref(240);
      const reduceSurfaceOffset = () => {
        surfaceOffset.value = 96;
      };
      return { reduceSurfaceOffset, surfaceOffset };
    },
    template: `
      <div>
        <button
          type="button"
          data-testid="vcc-change-surface-offset"
          @click="reduceSurfaceOffset"
        >
          Move surface upward
        </button>
        <VirtualCollectionCapabilityFixture
          axis="vertical"
          :item-count="10000"
          :surface-offset="surfaceOffset"
        />
      </div>
    `,
  }),
};

export const UndefinedSourceValue: Story = {
  args: { axis: 'vertical', itemCount: 20, undefinedValueAt: 5 },
};

export const MountCycle: StoryObj = {
  render: () => ({
    components: { VirtualCollectionCapabilityFixture },
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
        <VirtualCollectionCapabilityFixture v-if="mounted" axis="vertical" :item-count="200" />
      </div>
    `,
  }),
};
