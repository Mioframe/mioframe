import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDButton from '../Button/MDButton.vue';
import { MDStateLayerForcedStateProvider } from '../State/testing';
import MDCard from './MDCard.vue';

/**
 * Material 3 card. Checked against `components/cards/overview.md`,
 * `components/cards/specs.md`, `components/cards/guidelines.md`, and
 * `components/cards/accessibility.md` (m3-docs-mcp cache).
 *
 * A card is either a non-actionable container that holds its own buttons/links
 * (`mode="static"`, the default), or a directly actionable card surface with no
 * internal buttons/links (`mode="button"` / `mode="link"`). Material explicitly
 * warns against stacking actionable surfaces, so MDCard does not support nested
 * buttons/links inside an actionable card as a documented pattern — that
 * combination is a deviation from the component contract, not a supported slot
 * shape. There is no dev-time DOM scan for it: MDCard's default slot renders
 * arbitrary content, so a reliable check would require inspecting rendered
 * slot output, which this component intentionally does not do.
 */
const meta = {
  title: 'shared/ui/MDCard',
  component: MDCard,
  argTypes: {
    onAction: { action: 'action' },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => ({
    components: { MDCard },
    template: `
      <div class="visual-row">
        <MDCard variant="elevated" style="width: 220px;">Elevated card</MDCard>
        <MDCard variant="filled" style="width: 220px;">Filled card</MDCard>
        <MDCard variant="outlined" style="width: 220px;">Outlined card</MDCard>
      </div>
    `,
  }),
};

export const StaticWithInternalActions: Story = {
  name: 'Static card with internal actions',
  render: () => ({
    components: { MDCard, MDButton },
    template: `
      <MDCard variant="outlined" style="width: 280px;">
        <h3 style="margin: 0;">Install Mioframe</h3>
        <p style="margin: 0;">Add Mioframe to your home screen for quick access.</p>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <MDButton label="Later" color="text" />
          <MDButton label="Install" color="filled" />
        </div>
      </MDCard>
    `,
  }),
};

export const ActionableButtonCard: Story = {
  name: 'Actionable button card',
  render: (args) => ({
    components: { MDCard },
    setup: () => ({ args }),
    template: `
      <MDCard v-bind="args" mode="button" variant="elevated" style="width: 220px;" @action="args.onAction">
        Tap this whole card
      </MDCard>
    `,
  }),
};

export const ActionableLinkCard: Story = {
  name: 'Actionable link card',
  render: (args) => ({
    components: { MDCard },
    setup: () => ({ args }),
    template: `
      <MDCard v-bind="args" mode="link" href="https://m3.material.io/components/cards" variant="outlined" style="width: 220px;" @action="args.onAction">
        Open Material 3 cards docs
      </MDCard>
    `,
  }),
};

export const DisabledActionableCards: Story = {
  name: 'Disabled actionable cards',
  render: () => ({
    components: { MDCard },
    template: `
      <div class="visual-row">
        <MDCard mode="button" variant="elevated" disabled style="width: 200px;">Disabled button card</MDCard>
        <MDCard mode="link" href="/unreachable" variant="outlined" disabled style="width: 200px;">Disabled link card</MDCard>
      </div>
    `,
  }),
};

export const Dragged: Story = {
  render: () => ({
    components: { MDCard },
    template: `
      <MDCard mode="button" variant="elevated" dragged style="width: 220px;">Dragged card</MDCard>
    `,
  }),
};

const variantInteractionStatesTemplate = (variant: 'elevated' | 'filled' | 'outlined') => `
  <div class="visual-row">
    <MDCard mode="button" variant="${variant}" style="width: 180px;">Rest</MDCard>
    <MDStateLayerForcedStateProvider hovered>
      <MDCard mode="button" variant="${variant}" style="width: 180px;">Hover</MDCard>
    </MDStateLayerForcedStateProvider>
    <MDStateLayerForcedStateProvider focused>
      <MDCard mode="button" variant="${variant}" style="width: 180px;">Focused</MDCard>
    </MDStateLayerForcedStateProvider>
    <MDStateLayerForcedStateProvider pressed>
      <MDCard mode="button" variant="${variant}" style="width: 180px;">Pressed</MDCard>
    </MDStateLayerForcedStateProvider>
  </div>
`;

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDCard, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-card-interaction-states" class="visual-checker-backdrop">
        ${variantInteractionStatesTemplate('elevated')}
        ${variantInteractionStatesTemplate('filled')}
        ${variantInteractionStatesTemplate('outlined')}
      </div>
    `,
  }),
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDCard },
    template: `
      <div data-testid="visual-md-card-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDCard variant="elevated" style="width: 180px;">Elevated static</MDCard>
          <MDCard variant="filled" style="width: 180px;">Filled static</MDCard>
          <MDCard variant="outlined" style="width: 180px;">Outlined static</MDCard>
        </div>
        <div class="visual-row">
          <MDCard mode="button" variant="elevated" style="width: 180px;">Elevated button</MDCard>
          <MDCard mode="button" variant="filled" style="width: 180px;">Filled button</MDCard>
          <MDCard mode="button" variant="outlined" style="width: 180px;">Outlined button</MDCard>
        </div>
        <div class="visual-row">
          <MDCard mode="button" variant="elevated" disabled style="width: 180px;">Disabled elevated</MDCard>
          <MDCard mode="button" variant="filled" disabled style="width: 180px;">Disabled filled</MDCard>
          <MDCard mode="button" variant="outlined" disabled style="width: 180px;">Disabled outlined</MDCard>
        </div>
        <div class="visual-row">
          <MDCard mode="button" variant="elevated" dragged style="width: 180px;">Dragged elevated</MDCard>
          <MDCard mode="button" variant="filled" dragged style="width: 180px;">Dragged filled</MDCard>
          <MDCard mode="button" variant="outlined" dragged style="width: 180px;">Dragged outlined</MDCard>
        </div>
      </div>
    `,
  }),
};
