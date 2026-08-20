import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import MDExtendedFloatingActionButton from './MDExtendedFloatingActionButton.vue';

const AddIcon = defineComponent({
  template: `
    <svg aria-hidden="true" focusable="false" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  `,
});

const meta = {
  title: 'Material 3/Components/Extended Floating Action Button/MDExtendedFloatingActionButton',
  component: MDExtendedFloatingActionButton,
  tags: ['autodocs'],
  args: { color: 'primary-container', size: 'small' },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MDExtendedFloatingActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    setup() {
      return { args };
    },
    template: `
      <MDExtendedFloatingActionButton :color="args.color" :size="args.size">
        <template #icon><AddIcon /></template>
        Create note
      </MDExtendedFloatingActionButton>
    `,
  }),
};

export const BehaviorContracts: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    setup() {
      const clickCount = ref(0);
      const onClick = () => {
        clickCount.value += 1;
      };
      return { clickCount, onClick };
    },
    template: `
      <div data-testid="md-extended-fab-behavior-contracts">
        <button type="button" data-testid="behavior-extended-fab-focus-origin">Focus origin</button>
        <MDExtendedFloatingActionButton @click="onClick">
          <template #icon><AddIcon data-testid="behavior-extended-fab-icon" /></template>
          Create a new note
        </MDExtendedFloatingActionButton>
        <MDExtendedFloatingActionButton data-testid="behavior-extended-fab-no-icon" @click="onClick">
          Create note without icon
        </MDExtendedFloatingActionButton>
        <output id="md-extended-fab-click-count">{{ clickCount }}</output>
      </div>
    `,
  }),
};

export const HostAttributeBoundary: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    setup() {
      const attemptedOverrides = ref<Record<string, unknown>>({
        'aria-label': 'Unrelated action',
        'bogus-consumer-flag': 'leak-attempt',
        disabled: true,
        extended: false,
        lowered: true,
        variant: 'primary',
      });
      const toggleAttemptedOverrides = () => {
        attemptedOverrides.value = {
          ...attemptedOverrides.value,
          disabled: !attemptedOverrides.value.disabled,
          variant: attemptedOverrides.value.variant === 'primary' ? 'secondary' : 'primary',
        };
      };
      return { attemptedOverrides, toggleAttemptedOverrides };
    },
    template: `
      <div data-testid="md-extended-fab-host-attribute-boundary">
        <MDExtendedFloatingActionButton
          data-testid="host-boundary-extended-fab"
          v-bind="attemptedOverrides"
        >
          <template #icon><AddIcon /></template>
          Create note
        </MDExtendedFloatingActionButton>
        <button data-testid="host-boundary-toggle" type="button" @click="toggleAttemptedOverrides">
          Toggle attempted overrides
        </button>
      </div>
    `,
  }),
};

export const GeometryContracts: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div data-testid="md-extended-fab-geometry-contracts" class="md-extended-fab-geometry-contracts">
        <MDExtendedFloatingActionButton data-testid="geometry-extended-fab-small" size="small">
          <template #icon><AddIcon data-testid="geometry-extended-fab-small-icon" /></template>
          Create note
        </MDExtendedFloatingActionButton>
        <MDExtendedFloatingActionButton data-testid="geometry-extended-fab-medium" size="medium">
          <template #icon><AddIcon data-testid="geometry-extended-fab-medium-icon" /></template>
          Create note
        </MDExtendedFloatingActionButton>
        <MDExtendedFloatingActionButton data-testid="geometry-extended-fab-large" size="large">
          <template #icon><AddIcon data-testid="geometry-extended-fab-large-icon" /></template>
          Create note
        </MDExtendedFloatingActionButton>
      </div>
    `,
  }),
};

export const GeometryTokenOverrideContracts: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div data-testid="geometry-token-override-extended-fab-contracts">
        <MDExtendedFloatingActionButton
          data-testid="geometry-token-override-extended-fab-small"
          size="small"
          style="
            --md-comp-extended-fab-small-container-height: 72px;
            --md-comp-extended-fab-small-icon-size: 32px;
          "
        >
          <template #icon>
            <AddIcon data-testid="geometry-token-override-extended-fab-small-icon" />
          </template>
          Create note
        </MDExtendedFloatingActionButton>
        <MDExtendedFloatingActionButton
          data-testid="geometry-token-override-extended-fab-medium"
          size="medium"
          style="
            --md-comp-extended-fab-medium-container-height: 96px;
            --md-comp-extended-fab-medium-icon-size: 36px;
          "
        >
          <template #icon>
            <AddIcon data-testid="geometry-token-override-extended-fab-medium-icon" />
          </template>
          Create note
        </MDExtendedFloatingActionButton>
        <MDExtendedFloatingActionButton
          data-testid="geometry-token-override-extended-fab-large"
          size="large"
          style="
            --md-comp-extended-fab-large-container-height: 112px;
            --md-comp-extended-fab-large-icon-size: 44px;
          "
        >
          <template #icon>
            <AddIcon data-testid="geometry-token-override-extended-fab-large-icon" />
          </template>
          Create note
        </MDExtendedFloatingActionButton>
      </div>
    `,
  }),
};

export const RtlContracts: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div dir="rtl" data-testid="rtl-extended-fab-contracts">
        <MDExtendedFloatingActionButton data-testid="rtl-extended-fab" size="small">
          <template #icon><AddIcon data-testid="rtl-extended-fab-icon" /></template>
          Create note
        </MDExtendedFloatingActionButton>
      </div>
    `,
  }),
};

export const MotionContracts: Story = {
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div
        data-testid="motion-extended-fab-contracts"
        style="--md-private-motion-expressive-fast-spatial-duration: 2s"
      >
        <MDExtendedFloatingActionButton data-testid="motion-extended-fab">
          <template #icon><AddIcon /></template>
          Create note
        </MDExtendedFloatingActionButton>
      </div>
    `,
  }),
};

export const RealInteractionFeedback: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div data-testid="visual-md-extended-fab-real-interaction">
        <MDExtendedFloatingActionButton>
          <template #icon><AddIcon /></template>
          Press me
        </MDExtendedFloatingActionButton>
      </div>
    `,
  }),
};

// BEHAVIOR.md "States and state precedence": only the plain primary/secondary/tertiary color
// mappings define a focus indicator (3dp thickness, 2dp outer offset); the container mappings
// (proven by RealInteractionFeedback above) do not. This story isolates a plain color mapping so
// the visual focus proof exercises the `--m3e-focus-ring-*` bridge instead of only re-proving the
// default primary-container path. The surface reserves 16px of padding around the host — well
// past the 3dp thickness plus 2dp outer offset the indicator draws outside the container's own
// border box — so the captured screenshot region actually includes the ring instead of clipping
// it at the button's own bounding box.
export const RealInteractionFeedbackPlainColor: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div data-testid="visual-md-extended-fab-plain-color-real-interaction" style="padding: 16px">
        <MDExtendedFloatingActionButton color="primary">
          <template #icon><AddIcon /></template>
          Press me
        </MDExtendedFloatingActionButton>
      </div>
    `,
  }),
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div data-testid="visual-md-extended-fab-states" class="visual-checker-backdrop">
        <div class="visual-column">
          <MDExtendedFloatingActionButton size="small">
            <template #icon><AddIcon /></template>
            Create note
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton size="medium">
            <template #icon><AddIcon /></template>
            Create note
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton size="large">
            <template #icon><AddIcon /></template>
            Create note
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton>Create note</MDExtendedFloatingActionButton>
        </div>
      </div>
    `,
  }),
};

export const TokenOverride: Story = {
  tags: ['visual'],
  render: () => ({
    components: { AddIcon, MDExtendedFloatingActionButton },
    template: `
      <div data-testid="visual-md-extended-fab-token-override" class="visual-checker-backdrop">
        <div class="visual-column">
          <MDExtendedFloatingActionButton
            color="primary-container"
            style="
              --md-comp-extended-fab-primary-container-container-color: #006e1c;
              --md-comp-extended-fab-primary-container-icon-color: #ffffff;
              --md-comp-extended-fab-primary-container-label-text-color: #ffffff;
            "
          >
            <template #icon><AddIcon /></template>
            Primary container
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton
            color="secondary-container"
            style="
              --md-comp-extended-fab-secondary-container-container-color: #6d4c41;
              --md-comp-extended-fab-secondary-container-icon-color: #ffffff;
              --md-comp-extended-fab-secondary-container-label-text-color: #ffffff;
            "
          >
            <template #icon><AddIcon /></template>
            Secondary container
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton
            color="tertiary-container"
            style="
              --md-comp-extended-fab-tertiary-container-container-color: #7b1fa2;
              --md-comp-extended-fab-tertiary-container-icon-color: #ffffff;
              --md-comp-extended-fab-tertiary-container-label-text-color: #ffffff;
            "
          >
            <template #icon><AddIcon /></template>
            Tertiary container
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton
            color="primary"
            style="
              --md-comp-extended-fab-primary-container-color: #0061a4;
              --md-comp-extended-fab-primary-icon-color: #ffffff;
              --md-comp-extended-fab-primary-label-text-color: #ffffff;
            "
          >
            <template #icon><AddIcon /></template>
            Primary
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton
            color="secondary"
            style="
              --md-comp-extended-fab-secondary-container-color: #426b1f;
              --md-comp-extended-fab-secondary-icon-color: #ffffff;
              --md-comp-extended-fab-secondary-label-text-color: #ffffff;
            "
          >
            <template #icon><AddIcon /></template>
            Secondary
          </MDExtendedFloatingActionButton>
          <MDExtendedFloatingActionButton
            color="tertiary"
            style="
              --md-comp-extended-fab-tertiary-container-color: #a33c5f;
              --md-comp-extended-fab-tertiary-icon-color: #ffffff;
              --md-comp-extended-fab-tertiary-label-text-color: #ffffff;
            "
          >
            <template #icon><AddIcon /></template>
            Tertiary
          </MDExtendedFloatingActionButton>
        </div>
      </div>
    `,
  }),
};
