import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDExtendedFab from './MDExtendedFab.vue';
import { MDStateLayerForcedStateProvider } from '../State/testing';
import { useFocusIndicator } from '../State/useFocusIndicator';

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
          '**Tokens**: checked against the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z`. Exact official `--md-comp-extended-fab-*` properties are the public override surface; icon-label gap follows size (`small`→8dp, `medium`→12dp, `large`→16dp) via `--md-comp-extended-fab-{small,medium,large}-icon-label-space`. Each style routes container, label, icon, elevation, and state-layer values through local rendered variables, while `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract.',
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

// Wraps args-only demonstrations in the canonical checkerboard backdrop without duplicating
// wrapper markup in every bare story; stories that already build a custom multi-row template
// carry their own `.visual-checker-backdrop` root instead of this decorator.
const withCheckerboard = () => ({
  template: '<div class="visual-checker-backdrop"><story /></div>',
});

export const Default: Story = {
  decorators: [withCheckerboard],
};

export const SizeGaps: Story = {
  render: () => ({
    components: { MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-size-gaps" class="visual-checker-backdrop">
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
        <div data-testid="visual-md-extended-fab-states" class="visual-checker-backdrop">
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

export const InteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDExtendedFab, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-extended-fab-interaction-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDExtendedFab label="Primary" color="primary" md-symbol="add" />
          <MDExtendedFab label="Secondary" color="secondary" md-symbol="edit" />
          <MDExtendedFab label="Tertiary" color="tertiary" md-symbol="star" />
        </div>
        <div class="visual-row">
          <MDExtendedFab label="Primary container" color="primary-container" md-symbol="add" />
          <MDExtendedFab label="Secondary container" color="secondary-container" md-symbol="edit" />
          <MDExtendedFab label="Tertiary container" color="tertiary-container" md-symbol="star" />
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDExtendedFab class="md-state_hover" label="Hover" color="primary-container" md-symbol="add" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDExtendedFab class="md-state_focused" label="Focus" color="primary-container" md-symbol="add" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDExtendedFab class="md-state_pressed" label="Pressed" color="primary-container" md-symbol="add" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDExtendedFab label="Small" size="small" color="primary-container" md-symbol="add" />
          <MDExtendedFab label="Medium" size="medium" color="primary-container" md-symbol="add" />
          <MDExtendedFab label="Large" size="large" color="primary-container" md-symbol="add" />
        </div>
        <div class="visual-row">
          <MDExtendedFab label="With icon" color="primary-container" md-symbol="add" />
          <MDExtendedFab label="No icon" color="primary-container" />
          <MDExtendedFab label="Loading" color="primary-container" md-symbol="add" :loading="65" />
        </div>
      </div>
    `,
  }),
};

export const FocusIndicatorTarget: Story = {
  decorators: [withCheckerboard],
  render: () => ({
    components: { MDExtendedFab },
    setup() {
      useFocusIndicator();
    },
    template: `
      <div id="visual-md-extended-fab-focus-indicator" style="position: fixed; inset: auto 12px 12px auto;">
        <MDExtendedFab id="storybook-md-extended-fab-focus" label="Focus target" color="primary-container" md-symbol="add" />
      </div>
    `,
  }),
};

/** The six Material-documented Extended FAB color styles, in the order rendered by the matrix below. */
const EXTENDED_FAB_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'primary-container',
  'secondary-container',
  'tertiary-container',
] as const;

type ExtendedFabColor = (typeof EXTENDED_FAB_COLORS)[number];
type ExtendedFabTokenState = 'hovered' | 'focused' | 'pressed';

/**
 * Deterministic, hand-written override values used only to prove that hover/focus/pressed label
 * color, icon color, state-layer color/opacity, and container elevation route independently
 * through each color's own `--md-comp-extended-fab-<color>-*` custom properties. Test-local
 * fixture data, not a production token table.
 */
const EXTENDED_FAB_TOKEN_MATRIX: Record<
  ExtendedFabColor,
  Record<ExtendedFabTokenState, { label: string; icon: string; elevation: string; opacity: string }>
> = {
  primary: {
    hovered: {
      label: 'rgb(255 0 0)',
      icon: 'rgb(255 120 0)',
      elevation: '0 0 0 3px rgb(12 34 56)',
      opacity: '0.03',
    },
    focused: {
      label: 'rgb(0 128 0)',
      icon: 'rgb(0 180 120)',
      elevation: '0 0 0 4px rgb(23 45 67)',
      opacity: '0.17',
    },
    pressed: {
      label: 'rgb(0 0 255)',
      icon: 'rgb(120 0 255)',
      elevation: '0 0 0 5px rgb(34 56 78)',
      opacity: '0.29',
    },
  },
  secondary: {
    hovered: {
      label: 'rgb(255 60 0)',
      icon: 'rgb(255 150 0)',
      elevation: '0 0 0 9px rgb(78 90 112)',
      opacity: '0.03',
    },
    focused: {
      label: 'rgb(0 150 60)',
      icon: 'rgb(0 200 150)',
      elevation: '0 0 0 10px rgb(89 101 123)',
      opacity: '0.17',
    },
    pressed: {
      label: 'rgb(20 20 255)',
      icon: 'rgb(150 20 255)',
      elevation: '0 0 0 11px rgb(101 112 134)',
      opacity: '0.29',
    },
  },
  tertiary: {
    hovered: {
      label: 'rgb(255 100 0)',
      icon: 'rgb(255 180 0)',
      elevation: '0 0 0 12px rgb(112 123 145)',
      opacity: '0.03',
    },
    focused: {
      label: 'rgb(0 170 90)',
      icon: 'rgb(0 220 180)',
      elevation: '0 0 0 13px rgb(123 134 156)',
      opacity: '0.17',
    },
    pressed: {
      label: 'rgb(60 20 255)',
      icon: 'rgb(180 20 255)',
      elevation: '0 0 0 14px rgb(134 145 167)',
      opacity: '0.29',
    },
  },
  'primary-container': {
    hovered: {
      label: 'rgb(255 80 0)',
      icon: 'rgb(255 180 0)',
      elevation: '0 0 0 6px rgb(45 67 89)',
      opacity: '0.05',
    },
    focused: {
      label: 'rgb(0 160 120)',
      icon: 'rgb(0 220 180)',
      elevation: '0 0 0 7px rgb(56 78 90)',
      opacity: '0.19',
    },
    pressed: {
      label: 'rgb(80 80 255)',
      icon: 'rgb(140 80 255)',
      elevation: '0 0 0 8px rgb(67 89 101)',
      opacity: '0.31',
    },
  },
  'secondary-container': {
    hovered: {
      label: 'rgb(255 110 20)',
      icon: 'rgb(255 200 20)',
      elevation: '0 0 0 15px rgb(145 156 178)',
      opacity: '0.05',
    },
    focused: {
      label: 'rgb(20 190 140)',
      icon: 'rgb(20 230 200)',
      elevation: '0 0 0 16px rgb(156 167 189)',
      opacity: '0.19',
    },
    pressed: {
      label: 'rgb(100 100 255)',
      icon: 'rgb(160 100 255)',
      elevation: '0 0 0 17px rgb(167 178 200)',
      opacity: '0.31',
    },
  },
  'tertiary-container': {
    hovered: {
      label: 'rgb(255 130 40)',
      icon: 'rgb(255 210 40)',
      elevation: '0 0 0 18px rgb(178 189 211)',
      opacity: '0.05',
    },
    focused: {
      label: 'rgb(40 200 160)',
      icon: 'rgb(40 240 210)',
      elevation: '0 0 0 19px rgb(189 200 222)',
      opacity: '0.19',
    },
    pressed: {
      label: 'rgb(120 120 255)',
      icon: 'rgb(180 120 255)',
      elevation: '0 0 0 20px rgb(200 211 233)',
      opacity: '0.31',
    },
  },
};

/**
 * Rotates an `rgb(r g b)` literal's channels (r,g,b) -\> (b,r,g) so a derived state-layer color
 * is guaranteed independent from the label color it's derived from, without hand-authoring a
 * third literal per cell.
 * @param rgb - An `rgb(r g b)` color literal.
 * @returns The same color with its channels rotated.
 */
const rotateRgbChannels = (rgb: string) => {
  const [r, g, b] = rgb.replace(/^rgb\(|\)$/g, '').split(' ');
  return `rgb(${b} ${r} ${g})`;
};

const extendedFabTokenStyle = (color: ExtendedFabColor, state: ExtendedFabTokenState) => {
  const override = EXTENDED_FAB_TOKEN_MATRIX[color][state];
  return {
    [`--md-comp-extended-fab-${color}-${state}-label-text-color`]: override.label,
    [`--md-comp-extended-fab-${color}-${state}-icon-color`]: override.icon,
    [`--md-comp-extended-fab-${color}-${state}-container-elevation`]: override.elevation,
    [`--md-comp-extended-fab-${color}-${state}-state-layer-color`]: rotateRgbChannels(
      override.label,
    ),
    [`--md-comp-extended-fab-${color}-${state}-state-layer-opacity`]: override.opacity,
  };
};

export const InteractionStateTokens: Story = {
  render: () => ({
    components: { MDExtendedFab, MDStateLayerForcedStateProvider },
    setup() {
      return { EXTENDED_FAB_COLORS, extendedFabTokenStyle };
    },
    template: `
      <div data-testid="visual-md-extended-fab-interaction-state-tokens" class="visual-checker-backdrop">
        <div v-for="color in EXTENDED_FAB_COLORS" :key="color" class="visual-row">
          <MDExtendedFab :data-testid="\`extended-\${color}-resting\`" :label="\`\${color} resting\`" :color="color" md-symbol="add" />
          <MDStateLayerForcedStateProvider hovered>
            <MDExtendedFab
              :data-testid="\`extended-\${color}-hover\`"
              class="md-state_hover"
              :label="\`\${color} hover\`"
              :color="color"
              md-symbol="add"
              :style="extendedFabTokenStyle(color, 'hovered')"
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDExtendedFab
              :data-testid="\`extended-\${color}-focus\`"
              class="md-state_focused"
              :label="\`\${color} focus\`"
              :color="color"
              md-symbol="add"
              :style="extendedFabTokenStyle(color, 'focused')"
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDExtendedFab
              :data-testid="\`extended-\${color}-pressed\`"
              class="md-state_pressed"
              :label="\`\${color} pressed\`"
              :color="color"
              md-symbol="add"
              :style="extendedFabTokenStyle(color, 'pressed')"
            />
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

export const LoadingColorRouting: Story = {
  render: () => ({
    components: { MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-loading-color-routing" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDExtendedFab
            data-testid="extended-fab-resting-color"
            label="Loading"
            color="primary"
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-label-text-color: rgb(12 34 56);
              --md-comp-extended-fab-primary-icon-color: rgb(90 12 180);
            "
          />
          <MDExtendedFab
            data-testid="extended-fab-loading-color"
            label="Loading"
            color="primary"
            loading
            md-symbol="add"
            style="
              --md-comp-extended-fab-primary-label-text-color: rgb(12 34 56);
              --md-comp-extended-fab-primary-icon-color: rgb(90 12 180);
            "
          />
        </div>
      </div>
    `,
  }),
};
