import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import MDFab from './MDFab.vue';

const AddIcon = defineComponent({
  template: `
    <svg aria-hidden="true" focusable="false" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 4v16m8-8H4" fill="none" stroke="currentColor" stroke-width="2" />
    </svg>
  `,
});

const meta = {
  title: 'Material 3/Components/Floating Action Button/MDFab',
  component: MDFab,
  // Selective Autodocs (docs/testing/storybook.md "Documentation and Autodocs"): generated
  // from the real vue-component-meta docgen already configured for Storybook, not a
  // handwritten duplicate of the public props/emits/slots below.
  tags: ['autodocs'],
  args: { label: 'Compose a new message' },
  argTypes: { onClick: { action: 'click' } },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mioframe Material Floating action button adapter backed privately by @m3e/web. Demand-scoped to the single official standalone default: medium size, primary-container color, a required icon, and a required accessible action label. No disabled affordance exists — official guidance forbids disabling a FAB.',
      },
    },
  },
} satisfies Meta<typeof MDFab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { AddIcon, MDFab },
    setup() {
      return { args };
    },
    template: '<MDFab v-bind="args"><template #icon><AddIcon /></template></MDFab>',
  }),
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDFab },
    template: `
      <div data-testid="visual-md-fab-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDFab label="Compose"><template #icon><AddIcon /></template></MDFab>
        </div>
      </div>
    `,
  }),
};

export const BehaviorContracts: Story = {
  render: () => ({
    components: { AddIcon, MDFab },
    setup() {
      const clickCount = ref(0);
      const onClick = () => {
        clickCount.value += 1;
      };
      return { clickCount, onClick };
    },
    template: `
      <div data-testid="md-fab-behavior-contracts">
        <MDFab label="Compose a new message" @click="onClick">
          <template #icon><AddIcon data-testid="behavior-fab-icon" /></template>
        </MDFab>
        <output id="md-fab-click-count">{{ clickCount }}</output>
      </div>
    `,
  }),
};

export const HostAttributeBoundary: Story = {
  render: () => ({
    components: { AddIcon, MDFab },
    setup() {
      const attemptedOverrides = ref<Record<string, unknown>>({
        'bogus-consumer-flag': 'leak-attempt',
        disabled: true,
        extended: true,
        lowered: true,
        size: 'large',
        variant: 'primary',
      });
      const toggleAttemptedOverrides = () => {
        attemptedOverrides.value = {
          ...attemptedOverrides.value,
          disabled: !attemptedOverrides.value.disabled,
          size: attemptedOverrides.value.size === 'large' ? 'small' : 'large',
          variant: attemptedOverrides.value.variant === 'primary' ? 'secondary' : 'primary',
        };
      };
      return { attemptedOverrides, toggleAttemptedOverrides };
    },
    template: `
      <div data-testid="md-fab-host-attribute-boundary">
        <MDFab
          data-testid="host-boundary-fab"
          label="Boundary action"
          v-bind="attemptedOverrides"
        >
          <template #icon><AddIcon /></template>
        </MDFab>
        <button
          data-testid="host-boundary-toggle"
          type="button"
          @click="toggleAttemptedOverrides"
        >
          Toggle attempted overrides
        </button>
      </div>
    `,
  }),
};

export const GeometryContract: Story = {
  render: () => ({
    components: { AddIcon, MDFab },
    template: `
      <div data-testid="md-fab-geometry-contract">
        <MDFab data-testid="geometry-fab" label="Compose a new message">
          <template #icon><AddIcon data-testid="geometry-fab-icon" /></template>
        </MDFab>
      </div>
    `,
  }),
};

export const RealInteractionFeedback: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDFab },
    template: `
      <div data-testid="visual-md-fab-real-interaction" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDFab label="Press me"><template #icon><AddIcon /></template></MDFab>
        </div>
      </div>
    `,
  }),
};
