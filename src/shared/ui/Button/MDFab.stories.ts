import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDFab from './MDFab.vue';
import { MDStateLayerForcedStateProvider } from '../State/testing';
import { useFocusIndicator } from '../State/useFocusIndicator';

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
  <div data-testid="visual-md-fab-states" class="visual-checker-backdrop visual-gallery-grid" style="--visual-gallery-columns: 2">
    <div class="visual-row"><span class="visual-gallery-label">Primary enabled</span><span class="visual-gallery-label">Secondary enabled</span><span class="visual-gallery-label">Tertiary enabled</span></div>
    <div class="visual-row">
      <MDFab tooltip="Primary" color="primary" md-symbol="add" />
      <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
      <MDFab tooltip="Tertiary" color="tertiary" md-symbol="share" />
    </div>
    <div class="visual-row"><span class="visual-gallery-label">Primary container enabled</span><span class="visual-gallery-label">Secondary container enabled</span><span class="visual-gallery-label">Tertiary container enabled</span></div>
    <div class="visual-row">
      <MDFab tooltip="Primary container" color="primary-container" md-symbol="check" />
      <MDFab tooltip="Secondary container" color="secondary-container" md-symbol="star" />
      <MDFab tooltip="Tertiary container" color="tertiary-container" md-symbol="menu" />
    </div>
    <div class="visual-row"><span class="visual-gallery-label">Medium</span><span class="visual-gallery-label">Large</span><span class="visual-gallery-label">Loading</span></div>
    <div class="visual-row">
      <MDFab tooltip="Medium" size="medium" md-symbol="star" />
      <MDFab tooltip="Large" size="large" md-symbol="menu" />
      <MDFab tooltip="Loading" :loading="65" md-symbol="add" />
    </div>
  </div>
`;

const fabInteractionStatesTemplate = `
  <div data-testid="visual-md-fab-interaction-states" class="visual-checker-backdrop visual-gallery-grid" style="--visual-gallery-columns: 3">
    <div class="visual-row"><span class="visual-gallery-heading">Primary</span><span class="visual-gallery-label">Hover</span><span class="visual-gallery-label">Focus</span><span class="visual-gallery-label">Pressed</span></div>
    <div class="visual-row"><span aria-hidden="true"></span>
      <MDStateLayerForcedStateProvider hovered><MDFab class="md-state_hover" tooltip="Primary hover" color="primary" md-symbol="add" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider focused><MDFab class="md-state_focused" tooltip="Primary focus" color="primary" md-symbol="add" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider pressed><MDFab class="md-state_pressed" tooltip="Primary pressed" color="primary" md-symbol="add" /></MDStateLayerForcedStateProvider>
    </div>
    <div class="visual-row"><span class="visual-gallery-heading">Secondary</span><span class="visual-gallery-label">Hover</span><span class="visual-gallery-label">Focus</span><span class="visual-gallery-label">Pressed</span></div>
    <div class="visual-row"><span aria-hidden="true"></span>
      <MDStateLayerForcedStateProvider hovered><MDFab class="md-state_hover" tooltip="Secondary hover" color="secondary" md-symbol="edit" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider focused><MDFab class="md-state_focused" tooltip="Secondary focus" color="secondary" md-symbol="edit" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider pressed><MDFab class="md-state_pressed" tooltip="Secondary pressed" color="secondary" md-symbol="edit" /></MDStateLayerForcedStateProvider>
    </div>
    <div class="visual-row"><span class="visual-gallery-heading">Tertiary</span><span class="visual-gallery-label">Hover</span><span class="visual-gallery-label">Focus</span><span class="visual-gallery-label">Pressed</span></div>
    <div class="visual-row"><span aria-hidden="true"></span>
      <MDStateLayerForcedStateProvider hovered><MDFab class="md-state_hover" tooltip="Tertiary hover" color="tertiary" md-symbol="share" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider focused><MDFab class="md-state_focused" tooltip="Tertiary focus" color="tertiary" md-symbol="share" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider pressed><MDFab class="md-state_pressed" tooltip="Tertiary pressed" color="tertiary" md-symbol="share" /></MDStateLayerForcedStateProvider>
    </div>
    <div class="visual-row"><span class="visual-gallery-heading">Primary container</span><span class="visual-gallery-label">Hover</span><span class="visual-gallery-label">Focus</span><span class="visual-gallery-label">Pressed</span></div>
    <div class="visual-row"><span aria-hidden="true"></span>
      <MDStateLayerForcedStateProvider hovered><MDFab class="md-state_hover" tooltip="Primary container hover" color="primary-container" md-symbol="check" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider focused><MDFab class="md-state_focused" tooltip="Primary container focus" color="primary-container" md-symbol="check" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider pressed><MDFab class="md-state_pressed" tooltip="Primary container pressed" color="primary-container" md-symbol="check" /></MDStateLayerForcedStateProvider>
    </div>
    <div class="visual-row"><span class="visual-gallery-heading">Secondary container</span><span class="visual-gallery-label">Hover</span><span class="visual-gallery-label">Focus</span><span class="visual-gallery-label">Pressed</span></div>
    <div class="visual-row"><span aria-hidden="true"></span>
      <MDStateLayerForcedStateProvider hovered><MDFab class="md-state_hover" tooltip="Secondary container hover" color="secondary-container" md-symbol="star" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider focused><MDFab class="md-state_focused" tooltip="Secondary container focus" color="secondary-container" md-symbol="star" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider pressed><MDFab class="md-state_pressed" tooltip="Secondary container pressed" color="secondary-container" md-symbol="star" /></MDStateLayerForcedStateProvider>
    </div>
    <div class="visual-row"><span class="visual-gallery-heading">Tertiary container</span><span class="visual-gallery-label">Hover</span><span class="visual-gallery-label">Focus</span><span class="visual-gallery-label">Pressed</span></div>
    <div class="visual-row"><span aria-hidden="true"></span>
      <MDStateLayerForcedStateProvider hovered><MDFab class="md-state_hover" tooltip="Tertiary container hover" color="tertiary-container" md-symbol="menu" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider focused><MDFab class="md-state_focused" tooltip="Tertiary container focus" color="tertiary-container" md-symbol="menu" /></MDStateLayerForcedStateProvider>
      <MDStateLayerForcedStateProvider pressed><MDFab class="md-state_pressed" tooltip="Tertiary container pressed" color="tertiary-container" md-symbol="menu" /></MDStateLayerForcedStateProvider>
    </div>
  </div>
`;

// Wraps args-only demonstrations in the canonical checkerboard backdrop without duplicating
// wrapper markup in every bare story; stories that already build a custom multi-row template
// carry their own `.visual-checker-backdrop` root instead of this decorator.
const withCheckerboard = () => ({
  template: '<div class="visual-checker-backdrop"><story /></div>',
});

export const Default: Story = {
  decorators: [withCheckerboard],
};

export const Secondary: Story = {
  args: {
    color: 'secondary',
  },
  decorators: [withCheckerboard],
};

export const Large: Story = {
  args: {
    size: 'large',
  },
  decorators: [withCheckerboard],
};

export const Loading: Story = {
  args: {
    loading: true,
  },
  decorators: [withCheckerboard],
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
    components: { MDFab, MDStateLayerForcedStateProvider },
    template: fabInteractionStatesTemplate,
  }),
};

export const SizeComparison: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDFab },
    template: `
      <div data-testid="visual-md-fab-size-comparison" class="visual-checker-backdrop visual-gallery-grid" style="--visual-gallery-columns: 2">
        <div class="visual-row"><span class="visual-gallery-label">Regular</span><span class="visual-gallery-label">Medium</span><span class="visual-gallery-label">Large</span></div>
        <div class="visual-row">
          <MDFab data-testid="fab-size-regular" tooltip="Regular" size="regular" color="primary-container" md-symbol="add" />
          <MDFab data-testid="fab-size-medium" tooltip="Medium" size="medium" color="primary-container" md-symbol="add" />
          <MDFab data-testid="fab-size-large" tooltip="Large" size="large" color="primary-container" md-symbol="add" />
        </div>
      </div>
    `,
  }),
};

export const FocusIndicatorTarget: Story = {
  decorators: [withCheckerboard],
  render: () => ({
    components: { MDFab },
    setup() {
      useFocusIndicator();
    },
    template: `
      <div class="visual-checker-backdrop" style="position:fixed;inset:0;">
        <div id="visual-md-fab-focus-indicator" style="position:absolute;inset:auto 12px 12px auto;">
        <MDFab id="storybook-md-fab-focus" tooltip="Focus target" color="primary-container" md-symbol="add" />
        </div>
      </div>
    `,
  }),
};

/** The six Material-documented FAB color styles, in the order rendered by every matrix below. */
const FAB_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'primary-container',
  'secondary-container',
  'tertiary-container',
] as const;

type FabColor = (typeof FAB_COLORS)[number];
type FabTokenState = 'hovered' | 'focused' | 'pressed';

/**
 * Deterministic, hand-written override values used only to prove that hover/focus/pressed icon
 * color, state-layer color/opacity, and container elevation route independently through each
 * color's own `--md-comp-fab-<color>-*` custom properties. Test-local fixture data, not a
 * production token table: every color routes through the same `MDFab.vue` CSS, just with a
 * distinct override value per cell so cross-state/cross-color assertions are meaningful.
 */
const FAB_TOKEN_MATRIX: Record<
  FabColor,
  Record<FabTokenState, { icon: string; elevation: string; opacity: string }>
> = {
  primary: {
    hovered: { icon: 'rgb(255 0 0)', elevation: '0 0 0 3px rgb(12 34 56)', opacity: '0.03' },
    focused: { icon: 'rgb(0 128 0)', elevation: '0 0 0 4px rgb(23 45 67)', opacity: '0.17' },
    pressed: { icon: 'rgb(0 0 255)', elevation: '0 0 0 5px rgb(34 56 78)', opacity: '0.29' },
  },
  secondary: {
    hovered: { icon: 'rgb(255 90 0)', elevation: '0 0 0 9px rgb(78 90 112)', opacity: '0.03' },
    focused: { icon: 'rgb(0 150 40)', elevation: '0 0 0 10px rgb(89 101 123)', opacity: '0.17' },
    pressed: { icon: 'rgb(20 20 255)', elevation: '0 0 0 11px rgb(101 112 134)', opacity: '0.29' },
  },
  tertiary: {
    hovered: { icon: 'rgb(255 140 0)', elevation: '0 0 0 12px rgb(112 123 145)', opacity: '0.03' },
    focused: { icon: 'rgb(0 170 90)', elevation: '0 0 0 13px rgb(123 134 156)', opacity: '0.17' },
    pressed: { icon: 'rgb(60 20 255)', elevation: '0 0 0 14px rgb(134 145 167)', opacity: '0.29' },
  },
  'primary-container': {
    hovered: { icon: 'rgb(255 80 0)', elevation: '0 0 0 6px rgb(45 67 89)', opacity: '0.05' },
    focused: { icon: 'rgb(0 180 120)', elevation: '0 0 0 7px rgb(56 78 90)', opacity: '0.19' },
    pressed: { icon: 'rgb(60 60 255)', elevation: '0 0 0 8px rgb(67 89 101)', opacity: '0.31' },
  },
  'secondary-container': {
    hovered: {
      icon: 'rgb(255 100 20)',
      elevation: '0 0 0 15px rgb(145 156 178)',
      opacity: '0.05',
    },
    focused: {
      icon: 'rgb(20 190 140)',
      elevation: '0 0 0 16px rgb(156 167 189)',
      opacity: '0.19',
    },
    pressed: { icon: 'rgb(80 80 255)', elevation: '0 0 0 17px rgb(167 178 200)', opacity: '0.31' },
  },
  'tertiary-container': {
    hovered: {
      icon: 'rgb(255 120 40)',
      elevation: '0 0 0 18px rgb(178 189 211)',
      opacity: '0.05',
    },
    focused: {
      icon: 'rgb(40 200 160)',
      elevation: '0 0 0 19px rgb(189 200 222)',
      opacity: '0.19',
    },
    pressed: {
      icon: 'rgb(100 100 255)',
      elevation: '0 0 0 20px rgb(200 211 233)',
      opacity: '0.31',
    },
  },
};

/**
 * Rotates an `rgb(r g b)` literal's channels (r,g,b) -\> (b,r,g) so a derived state-layer color
 * is guaranteed independent from the icon color it's derived from, without hand-authoring a
 * second literal per cell.
 * @param rgb - An `rgb(r g b)` color literal.
 * @returns The same color with its channels rotated.
 */
const rotateRgbChannels = (rgb: string) => {
  const [r, g, b] = rgb.replace(/^rgb\(|\)$/g, '').split(' ');
  return `rgb(${b} ${r} ${g})`;
};

const fabTokenStyle = (color: FabColor, state: FabTokenState) => {
  const override = FAB_TOKEN_MATRIX[color][state];
  return {
    [`--md-comp-fab-${color}-${state}-icon-color`]: override.icon,
    [`--md-comp-fab-${color}-${state}-container-elevation`]: override.elevation,
    [`--md-comp-fab-${color}-${state}-state-layer-color`]: rotateRgbChannels(override.icon),
    [`--md-comp-fab-${color}-${state}-state-layer-opacity`]: override.opacity,
  };
};

export const InteractionStateTokens: Story = {
  render: () => ({
    components: { MDFab, MDStateLayerForcedStateProvider },
    setup() {
      return { FAB_COLORS, fabTokenStyle };
    },
    template: `
      <div data-testid="visual-md-fab-interaction-state-tokens" class="visual-checker-backdrop">
        <div v-for="color in FAB_COLORS" :key="color" class="visual-row">
          <MDFab :data-testid="\`\${color}-resting\`" :tooltip="\`\${color} resting\`" :color="color" md-symbol="add" />
          <MDStateLayerForcedStateProvider hovered>
            <MDFab
              :data-testid="\`\${color}-hover\`"
              class="md-state_hover"
              :tooltip="\`\${color} hover\`"
              :color="color"
              md-symbol="add"
              :style="fabTokenStyle(color, 'hovered')"
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDFab
              :data-testid="\`\${color}-focus\`"
              class="md-state_focused"
              :tooltip="\`\${color} focus\`"
              :color="color"
              md-symbol="add"
              :style="fabTokenStyle(color, 'focused')"
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDFab
              :data-testid="\`\${color}-pressed\`"
              class="md-state_pressed"
              :tooltip="\`\${color} pressed\`"
              :color="color"
              md-symbol="add"
              :style="fabTokenStyle(color, 'pressed')"
            />
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

export const LoadingColorRouting: Story = {
  render: () => ({
    components: { MDFab },
    template: `
      <div data-testid="visual-md-fab-loading-color-routing" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDFab
            data-testid="fab-resting-color"
            tooltip="Loading"
            color="primary"
            md-symbol="add"
            style="--md-comp-fab-primary-icon-color: rgb(12 34 56);"
          />
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
