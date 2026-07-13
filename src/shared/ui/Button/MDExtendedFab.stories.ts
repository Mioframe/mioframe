import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDExtendedFab from './MDExtendedFab.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDExtendedFab',
  component: MDExtendedFab,
  args: {
    label: 'Add',
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
          'Checked against Material 3 `components/extended-fab/{overview,guidelines,specs,accessibility}`.',
          '',
          '**Props**: `size` (`small` | `medium` | `large`, default `small`), `color` (`primary` | `secondary` | `tertiary` | `primary-container` | `secondary-container` | `tertiary-container`, default `primary-container`), required `label`, optional `tooltip` (also used as the accessible name fallback).',
          '',
          '**Slots**: `icon` (optional).',
          '',
          '**Project extension**: `loading` (`boolean | number`, `0` is active).',
          '',
          '**Tokens**: checked against the Material 3 MCP/cache snapshot captured 2026-06-30. Exact official `--md-comp-extended-fab-*` properties are the public override surface; icon-label gap follows size (`small`→8dp, `medium`→12dp, `large`→16dp) via `--md-comp-extended-fab-{small,medium,large}-icon-label-space`. Each style routes container, label, icon, elevation, and state-layer values through local rendered variables, while `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract.',
          '',
          '**Typography**: the label uses the shared `MD_TYPESCALE` utility classes (no handwritten font CSS), mapped by size: `small`→title-medium, `medium`→title-large, `large`→headline-small.',
          '',
          '**Color terminology**: `*-container` replaces the legacy `tonal-*` naming; `primary-container` preserves the previous `tonal-primary` visual default.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDExtendedFab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SizeGaps: Story = {
  render: () => ({
    components: { MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-size-gaps" class="visual-surface">
        <div class="visual-row">
          <MDExtendedFab data-testid="gap-small" label="Small" size="small" md-symbol="add" />
          <MDExtendedFab data-testid="gap-medium" label="Medium" size="medium" md-symbol="add" />
          <MDExtendedFab data-testid="gap-large" label="Large" size="large" md-symbol="add" />
        </div>
      </div>
    `,
  }),
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDExtendedFab },
    template: `
        <div data-testid="visual-md-extended-fab-states" class="visual-surface">
        <div class="visual-row">
          <MDExtendedFab label="Add" md-symbol="add" />
          <MDExtendedFab label="Share" color="secondary-container" md-symbol="share" />
          <MDExtendedFab label="Archive" color="primary" md-symbol="archive" />
        </div>
        <div class="visual-row">
          <MDExtendedFab label="Medium" size="medium" color="tertiary-container" md-symbol="star" />
          <MDExtendedFab label="Large" size="large" color="secondary" md-symbol="menu" />
        </div>
      </div>
    `,
  }),
};

export const InteractionStateTokens: Story = {
  render: () => ({
    components: { MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-interaction-state-tokens" class="visual-surface">
        <div class="visual-row">
          <MDExtendedFab data-testid="extended-primary-resting" label="Primary resting" color="primary" md-symbol="add" />
          <MDExtendedFab
            data-testid="extended-primary-hover"
            class="md-state_hover"
            label="Primary hover"
            color="primary"
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-hovered-label-text-color: rgb(255 0 0);
              --md-comp-extended-fab-primary-hovered-icon-color: rgb(255 120 0);
              --md-comp-extended-fab-primary-hovered-container-elevation: 0 0 0 3px rgb(12 34 56);
              --md-comp-extended-fab-primary-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-extended-fab-primary-hovered-state-layer-opacity: 0.03;
            "
          />
          <MDExtendedFab
            data-testid="extended-primary-focus"
            class="md-state_focused"
            label="Primary focus"
            color="primary"
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-focused-label-text-color: rgb(0 128 0);
              --md-comp-extended-fab-primary-focused-icon-color: rgb(0 180 120);
              --md-comp-extended-fab-primary-focused-container-elevation: 0 0 0 4px rgb(23 45 67);
              --md-comp-extended-fab-primary-focused-state-layer-color: rgb(0 128 0);
              --md-comp-extended-fab-primary-focused-state-layer-opacity: 0.17;
            "
          />
          <MDExtendedFab
            data-testid="extended-primary-pressed"
            class="md-state_pressed"
            label="Primary pressed"
            color="primary"
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-pressed-label-text-color: rgb(0 0 255);
              --md-comp-extended-fab-primary-pressed-icon-color: rgb(120 0 255);
              --md-comp-extended-fab-primary-pressed-container-elevation: 0 0 0 5px rgb(34 56 78);
              --md-comp-extended-fab-primary-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-extended-fab-primary-pressed-state-layer-opacity: 0.29;
            "
          />
        </div>
        <div class="visual-row">
          <MDExtendedFab data-testid="extended-container-resting" label="Container resting" color="primary-container" md-symbol="add" />
          <MDExtendedFab
            data-testid="extended-container-hover"
            class="md-state_hover"
            label="Container hover"
            color="primary-container"
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-container-hovered-label-text-color: rgb(255 80 0);
              --md-comp-extended-fab-primary-container-hovered-icon-color: rgb(255 180 0);
              --md-comp-extended-fab-primary-container-hovered-container-elevation: 0 0 0 6px rgb(45 67 89);
              --md-comp-extended-fab-primary-container-hovered-state-layer-color: rgb(255 80 0);
              --md-comp-extended-fab-primary-container-hovered-state-layer-opacity: 0.05;
            "
          />
          <MDExtendedFab
            data-testid="extended-container-focus"
            class="md-state_focused"
            label="Container focus"
            color="primary-container"
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-container-focused-label-text-color: rgb(0 160 120);
              --md-comp-extended-fab-primary-container-focused-icon-color: rgb(0 220 180);
              --md-comp-extended-fab-primary-container-focused-container-elevation: 0 0 0 7px rgb(56 78 90);
              --md-comp-extended-fab-primary-container-focused-state-layer-color: rgb(0 160 120);
              --md-comp-extended-fab-primary-container-focused-state-layer-opacity: 0.19;
            "
          />
          <MDExtendedFab
            data-testid="extended-container-pressed"
            class="md-state_pressed"
            label="Container pressed"
            color="primary-container"
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-container-pressed-label-text-color: rgb(80 80 255);
              --md-comp-extended-fab-primary-container-pressed-icon-color: rgb(140 80 255);
              --md-comp-extended-fab-primary-container-pressed-container-elevation: 0 0 0 8px rgb(67 89 101);
              --md-comp-extended-fab-primary-container-pressed-state-layer-color: rgb(80 80 255);
              --md-comp-extended-fab-primary-container-pressed-state-layer-opacity: 0.31;
            "
          />
        </div>
      </div>
    `,
  }),
};
