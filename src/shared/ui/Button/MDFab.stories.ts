import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDFab from './MDFab.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDFab',
  component: MDFab,
  args: {
    tooltip: 'Create item',
    mdSymbol: 'add',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'Checked against Material 3 `components/floating-action-button/{overview,guidelines,specs,accessibility}`.',
          '',
          '**Props**: `size` (`regular` | `medium` | `large`, default `regular`), `color` (`primary` | `secondary` | `tertiary` | `primary-container` | `secondary-container` | `tertiary-container`, default `primary-container`), required `tooltip`.',
          '',
          '**Slots**: `icon`.',
          '',
          '**Project extension**: `loading` (`boolean | number`, `0` is active).',
          '',
          '**Tokens**: checked against the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z`. Exact official `--md-comp-fab-*` properties are the public override surface. Each style routes container, icon, elevation, and state-layer values through local `--md-private-fab-*` rendered variables, while `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract.',
          '',
          '**Required icon**: an icon source (`mdSymbol` or the `icon` slot) is required. Missing icon content logs a development warning and renders no fallback placeholder.',
          '',
          '**Color terminology**: `*-container` replaces the legacy `tonal-*` naming, matching the current Material 3 Expressive token names.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDFab>;

export default meta;

type Story = StoryObj<typeof meta>;

const fabStatesTemplate = `
  <div data-testid="visual-md-fab-states" class="visual-surface">
    <div class="visual-row">
      <MDFab tooltip="Primary" color="primary" md-symbol="add" />
      <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
      <MDFab tooltip="Primary container" color="primary-container" md-symbol="check" />
    </div>
    <div class="visual-row">
      <MDFab tooltip="Medium" size="medium" md-symbol="star" />
      <MDFab tooltip="Large" size="large" md-symbol="menu" />
      <MDFab tooltip="Tertiary" color="tertiary" md-symbol="share" />
    </div>
  </div>
`;

const fabInteractionStatesTemplate = `
  <div data-testid="visual-md-fab-interaction-states" class="visual-surface">
    <div class="visual-row">
      <MDFab class="md-state_hover" tooltip="Primary hover" color="primary" md-symbol="add" />
      <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
      <MDFab tooltip="Primary container" color="primary-container" md-symbol="check" />
    </div>
    <div class="visual-row">
      <MDFab tooltip="Medium" size="medium" md-symbol="star" />
      <MDFab class="md-state_focused" tooltip="Focus" size="large" color="tertiary" md-symbol="share" />
      <MDFab class="md-state_pressed" tooltip="Pressed" color="secondary-container" md-symbol="menu" />
    </div>
  </div>
`;

export const Default: Story = {};

export const Secondary: Story = {
  args: {
    color: 'secondary',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDFab },
    template: fabStatesTemplate,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDFab },
    template: fabInteractionStatesTemplate,
  }),
};

export const InteractionStateTokens: Story = {
  render: () => ({
    components: { MDFab },
    template: `
      <div data-testid="visual-md-fab-interaction-state-tokens" class="visual-surface">
        <div class="visual-row">
          <MDFab data-testid="primary-resting" tooltip="Primary resting" color="primary" md-symbol="add" />
          <MDFab
            data-testid="primary-hover"
            class="md-state_hover"
            tooltip="Primary hover"
            color="primary"
            md-symbol="add"
            style="
              --md-comp-fab-primary-hovered-icon-color: rgb(255 0 0);
              --md-comp-fab-primary-hovered-container-elevation: 0 0 0 3px rgb(12 34 56);
              --md-comp-fab-primary-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-fab-primary-hovered-state-layer-opacity: 0.03;
            "
          />
          <MDFab
            data-testid="primary-focus"
            class="md-state_focused"
            tooltip="Primary focus"
            color="primary"
            md-symbol="add"
            style="
              --md-comp-fab-primary-focused-icon-color: rgb(0 128 0);
              --md-comp-fab-primary-focused-container-elevation: 0 0 0 4px rgb(23 45 67);
              --md-comp-fab-primary-focused-state-layer-color: rgb(0 128 0);
              --md-comp-fab-primary-focused-state-layer-opacity: 0.17;
            "
          />
          <MDFab
            data-testid="primary-pressed"
            class="md-state_pressed"
            tooltip="Primary pressed"
            color="primary"
            md-symbol="add"
            style="
              --md-comp-fab-primary-pressed-icon-color: rgb(0 0 255);
              --md-comp-fab-primary-pressed-container-elevation: 0 0 0 5px rgb(34 56 78);
              --md-comp-fab-primary-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-fab-primary-pressed-state-layer-opacity: 0.29;
            "
          />
        </div>
        <div class="visual-row">
          <MDFab data-testid="primary-container-resting" tooltip="Primary container resting" color="primary-container" md-symbol="add" />
          <MDFab
            data-testid="primary-container-hover"
            class="md-state_hover"
            tooltip="Primary container hover"
            color="primary-container"
            md-symbol="add"
            style="
              --md-comp-fab-primary-container-hovered-icon-color: rgb(255 80 0);
              --md-comp-fab-primary-container-hovered-container-elevation: 0 0 0 6px rgb(45 67 89);
              --md-comp-fab-primary-container-hovered-state-layer-color: rgb(255 80 0);
              --md-comp-fab-primary-container-hovered-state-layer-opacity: 0.05;
            "
          />
          <MDFab
            data-testid="primary-container-focus"
            class="md-state_focused"
            tooltip="Primary container focus"
            color="primary-container"
            md-symbol="add"
            style="
              --md-comp-fab-primary-container-focused-icon-color: rgb(0 180 120);
              --md-comp-fab-primary-container-focused-container-elevation: 0 0 0 7px rgb(56 78 90);
              --md-comp-fab-primary-container-focused-state-layer-color: rgb(0 180 120);
              --md-comp-fab-primary-container-focused-state-layer-opacity: 0.19;
            "
          />
          <MDFab
            data-testid="primary-container-pressed"
            class="md-state_pressed"
            tooltip="Primary container pressed"
            color="primary-container"
            md-symbol="add"
            style="
              --md-comp-fab-primary-container-pressed-icon-color: rgb(60 60 255);
              --md-comp-fab-primary-container-pressed-container-elevation: 0 0 0 8px rgb(67 89 101);
              --md-comp-fab-primary-container-pressed-state-layer-color: rgb(60 60 255);
              --md-comp-fab-primary-container-pressed-state-layer-opacity: 0.31;
            "
          />
        </div>
      </div>
    `,
  }),
};

export const LoadingColorRouting: Story = {
  render: () => ({
    components: { MDFab },
    template: `
      <div data-testid="visual-md-fab-loading-color-routing" class="visual-surface">
        <div class="visual-row">
          <MDFab
            data-testid="fab-loading-color"
            tooltip="Loading"
            color="primary"
            loading
            md-symbol="add"
            style="--md-comp-fab-primary-icon-color: rgb(12 34 56);"
          />
        </div>
      </div>
    `,
  }),
};
