import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import MDExtendedFab from './MDExtendedFab.vue';

// Canonical filled Material-compatible "add" glyph (mirrors floatingActionButton's identical
// canonical fixture; ARCHITECTURE.md "Implementation passes" #8): the standard Material
// Icons/Material Symbols "add" path — a single solid contour describing the plus shape, filled by
// `currentColor` with no `stroke`/`fill="none"`. Every icon-bearing story fixture (Default,
// VisualStates, BehaviorContracts, HostAttributeBoundary, GeometryContract,
// RealInteractionFeedback) shares this one decorative direct-SVG glyph.
const AddIcon = defineComponent({
  template: `
    <svg aria-hidden="true" focusable="false" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  `,
});

const meta = {
  title: 'Material 3/Components/Extended FAB/MDExtendedFab',
  component: MDExtendedFab,
  // Selective Autodocs (docs/testing/storybook.md "Documentation and Autodocs"): generated
  // from the real vue-component-meta docgen already configured for Storybook, not a
  // handwritten duplicate of the public props/emits/slots below.
  tags: ['autodocs'],
  args: { label: 'Add' },
  argTypes: { onClick: { action: 'click' } },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mioframe Material Extended FAB adapter backed privately by @m3e/web — the same `m3e-fab` element the floatingActionButton family composes, used here via its documented `extended` attribute and `label` slot. Demand-scoped to the selected configuration: small size (the officially recommended baseline-replacement size) and primary-container color (the documented Material default color mapping), a required visible label that doubles as the accessible action name, and an optional decorative icon slot. No disabled affordance exists — the product omits the action instead of rendering a disabled Extended FAB.',
      },
    },
  },
} satisfies Meta<typeof MDExtendedFab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { AddIcon, MDExtendedFab },
    setup() {
      return { args };
    },
    template: '<MDExtendedFab v-bind="args"><template #icon><AddIcon /></template></MDExtendedFab>',
  }),
};

export const LabelOnly: Story = {
  render: () => ({
    components: { MDExtendedFab },
    template: '<MDExtendedFab label="Add" />',
  }),
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDExtendedFab label="Add"><template #icon><AddIcon /></template></MDExtendedFab>
          <MDExtendedFab label="Add" />
        </div>
      </div>
    `,
  }),
};

export const BehaviorContracts: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFab },
    setup() {
      const clickCount = ref(0);
      const onClick = () => {
        clickCount.value += 1;
      };
      return { clickCount, onClick };
    },
    template: `
      <div data-testid="md-extended-fab-behavior-contracts">
        <MDExtendedFab label="Add" @click="onClick">
          <template #icon><AddIcon data-testid="behavior-extended-fab-icon" /></template>
        </MDExtendedFab>
        <output id="md-extended-fab-click-count">{{ clickCount }}</output>
      </div>
    `,
  }),
};

export const HostAttributeBoundary: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFab },
    setup() {
      const attemptedOverrides = ref<Record<string, unknown>>({
        'bogus-consumer-flag': 'leak-attempt',
        disabled: true,
        extended: false,
        lowered: true,
        size: 'large',
        variant: 'primary',
      });
      const toggleAttemptedOverrides = () => {
        attemptedOverrides.value = {
          ...attemptedOverrides.value,
          disabled: !attemptedOverrides.value.disabled,
          size: attemptedOverrides.value.size === 'large' ? 'medium' : 'large',
          variant: attemptedOverrides.value.variant === 'primary' ? 'secondary' : 'primary',
        };
      };
      return { attemptedOverrides, toggleAttemptedOverrides };
    },
    template: `
      <div data-testid="md-extended-fab-host-attribute-boundary">
        <MDExtendedFab
          data-testid="host-boundary-extended-fab"
          label="Boundary action"
          v-bind="attemptedOverrides"
        >
          <template #icon><AddIcon /></template>
        </MDExtendedFab>
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
    components: { AddIcon, MDExtendedFab },
    template: `
      <div data-testid="md-extended-fab-geometry-contract">
        <MDExtendedFab data-testid="geometry-extended-fab" label="Add">
          <template #icon><AddIcon data-testid="geometry-extended-fab-icon" /></template>
        </MDExtendedFab>
      </div>
    `,
  }),
};

export const RealInteractionFeedback: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-real-interaction" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDExtendedFab label="Press me"><template #icon><AddIcon /></template></MDExtendedFab>
        </div>
      </div>
    `,
  }),
};
