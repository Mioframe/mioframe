import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import '../../../../lib/md/index.css';
import { useFocusIndicator } from '../../../State/useFocusIndicator';
import { MDLoadingIndicator } from '../loadingIndicator';
import MDButton from './MDButton.vue';
import MDButtonTargetHitVisualStory from './MDButtonTargetHitVisualStory.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDButton',
  component: MDButton,
  // Selective Autodocs (docs/testing/storybook.md "Documentation and Autodocs"): generated
  // from the real vue-component-meta docgen already configured for Storybook, not a
  // handwritten duplicate of the public props/emits/slots below.
  tags: ['autodocs'],
  args: { color: 'filled', label: 'Save' },
  argTypes: { onClick: { action: 'click' } },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mioframe Material action Button adapter backed privately by @m3e/web. Supports the production-selected filled, outlined, and text colors, small and extra-small sizes, disabled state, native button/submit behavior, leading icon content, and short indeterminate loading.',
      },
    },
  },
} satisfies Meta<typeof MDButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Filled" color="filled"><template #icon>+</template></MDButton>
          <MDButton label="Outlined" color="outlined"><template #icon>+</template></MDButton>
          <MDButton label="Text" color="text"><template #icon>+</template></MDButton>
        </div>
        <div class="visual-row">
          <MDButton label="Extra small outlined" color="outlined" size="extra-small"><template #icon>+</template></MDButton>
        </div>
        <div class="visual-row">
          <MDButton label="Disabled filled" disabled><template #icon>+</template></MDButton>
          <MDButton label="Disabled outlined" color="outlined" disabled><template #icon>+</template></MDButton>
          <MDButton label="Disabled text" color="text" disabled><template #icon>+</template></MDButton>
        </div>
      </div>
    `,
  }),
};

export const SizeGeometry: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-size-geometry" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Extra small" size="extra-small"><template #icon>+</template></MDButton>
          <MDButton label="Small" size="small"><template #icon>+</template></MDButton>
        </div>
      </div>
    `,
  }),
};

export const ExpandedTargetHitArea: Story = {
  render: () => ({
    components: { MDButtonTargetHitVisualStory },
    template: '<MDButtonTargetHitVisualStory />',
  }),
};

export const SmallGeometryContract: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="md-button-small-geometry-contract">
        <MDButton id="small-geometry-button" label="Small geometry" size="small" />
      </div>
    `,
  }),
};

export const FocusIndicatorTarget: Story = {
  render: () => ({
    components: { MDButton },
    setup() {
      useFocusIndicator();
    },
    template: `
      <div class="visual-checker-backdrop" style="position:fixed;inset:0;">
        <div id="visual-md-button-focus-indicator" style="position:absolute;inset:auto 12px 12px auto;">
          <MDButton label="Focus target" />
        </div>
      </div>
    `,
  }),
};

export const BehaviorContracts: Story = {
  render: () => ({
    components: { MDButton },
    setup() {
      const submitCount = ref(0);
      const loadingClickCount = ref(0);
      const disabledClickCount = ref(0);
      const onSubmit = () => {
        submitCount.value += 1;
      };
      const onLoadingClick = () => {
        loadingClickCount.value += 1;
      };
      const onDisabledClick = () => {
        disabledClickCount.value += 1;
      };
      return {
        disabledClickCount,
        loadingClickCount,
        onDisabledClick,
        onLoadingClick,
        onSubmit,
        submitCount,
      };
    },
    template: `
      <div data-testid="md-button-behavior-contracts">
        <form aria-label="Button form" @submit.prevent="onSubmit">
          <MDButton label="Submit action" native-type="submit" />
        </form>
        <output id="md-button-submit-count">{{ submitCount }}</output>
        <MDButton label="Loading action" loading @click="onLoadingClick" />
        <output id="md-button-loading-count">{{ loadingClickCount }}</output>
        <MDButton label="Disabled action" disabled @click="onDisabledClick" />
        <output id="md-button-disabled-count">{{ disabledClickCount }}</output>
        <MDButton label="Disabled loading action" disabled loading @click="onDisabledClick" />
      </div>
    `,
  }),
};

export const HostAttributeBoundary: Story = {
  render: () => ({
    components: { MDButton },
    setup() {
      const attemptedOverrides = ref<Record<string, unknown>>({
        'bogus-consumer-flag': 'leak-attempt',
        selected: true,
        shape: 'square',
        toggle: true,
        variant: 'outlined',
      });
      const toggleAttemptedOverrides = () => {
        attemptedOverrides.value = {
          ...attemptedOverrides.value,
          selected: !attemptedOverrides.value.selected,
          shape: attemptedOverrides.value.shape === 'square' ? 'circle' : 'square',
          toggle: !attemptedOverrides.value.toggle,
          variant: attemptedOverrides.value.variant === 'outlined' ? 'text' : 'outlined',
        };
      };
      return { attemptedOverrides, toggleAttemptedOverrides };
    },
    template: `
      <div data-testid="md-button-host-attribute-boundary">
        <MDButton
          data-testid="host-boundary-button"
          label="Boundary action"
          color="filled"
          v-bind="attemptedOverrides"
        />
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

export const RealInteractionFeedback: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-real-interaction" class="visual-checker-backdrop">
        <MDButton label="Press me" color="filled" />
      </div>
    `,
  }),
};

export const LoadingIndicatorPresentation: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-loading" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Saving" color="filled" loading />
          <MDButton label="Uploading" color="outlined" loading><template #icon>+</template></MDButton>
          <MDButton label="Sending" color="text" loading />
        </div>
        <div class="visual-row">
          <MDButton label="Disabled saving" color="filled" disabled loading />
        </div>
      </div>
    `,
  }),
};

export const LegacySurfaceColorOwnership: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton, MDLoadingIndicator },
    template: `
      <div
        class="md"
        style="--md-container-color: #fff8f7; --md-content-color: #b3261e;"
      >
        <div
          data-testid="visual-md-button-legacy-surface"
          class="md visual-checker-backdrop"
          style="--md-container-color: #fff8f7; --md-content-color: #b3261e;"
        >
          <p data-testid="legacy-surface-text">Surface-owned ordinary text</p>
          <div class="visual-row">
            <MDButton label="Surface filled" color="filled" />
            <MDButton label="Surface outlined" color="outlined" />
            <MDButton label="Surface text" color="text" />
          </div>
          <div class="visual-row">
            <MDButton label="Surface icon" color="outlined">
              <template #icon><span data-testid="legacy-surface-button-icon">+</span></template>
            </MDButton>
            <MDButton label="Surface loading" color="text" loading />
          </div>
        </div>
        <MDLoadingIndicator label="Surface standalone loading" />
      </div>
    `,
  }),
};

export const ContextualTextTokens: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div class="visual-checker-backdrop" style="background: var(--md-sys-color-inverse-surface); padding: 16px;">
        <MDButton
          data-testid="contextual-text-button"
          label="Undo"
          color="text"
          style="
            --md-comp-button-text-label-text-color: var(--md-sys-color-inverse-primary);
            --md-comp-button-text-hovered-label-text-color: var(--md-sys-color-inverse-primary);
            --md-comp-button-text-focused-label-text-color: var(--md-sys-color-inverse-primary);
            --md-comp-button-text-pressed-label-text-color: var(--md-sys-color-inverse-primary);
            --md-comp-button-text-hovered-state-layer-color: var(--md-sys-color-inverse-primary);
            --md-comp-button-text-focused-state-layer-color: var(--md-sys-color-inverse-primary);
            --md-comp-button-text-pressed-state-layer-color: var(--md-sys-color-inverse-primary);
          "
        />
      </div>
    `,
  }),
};
