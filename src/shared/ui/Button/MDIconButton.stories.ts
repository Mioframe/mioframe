import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDIconButton from './MDIconButton.vue';
import MDIconButtonTargetHitVisualStory from './MDIconButtonTargetHitVisualStory.vue';
import MDIconButtonToolbarInteractionStory from './MDIconButtonToolbarInteractionStory.vue';
import MDIconButtonToolbarVisualStory from './MDIconButtonToolbarVisualStory.vue';
import { MDStateLayerForcedStateProvider } from '../State/testing';
import { useFocusIndicator } from '../State/useFocusIndicator';

const meta = {
  title: 'Material 3/Components/Buttons/MDIconButton',
  component: MDIconButton,
  args: {
    tooltip: 'Close',
    mdSymbolName: 'close',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'Checked against Material 3 `components/icon-buttons/{overview,guidelines,specs,accessibility}`.',
          '',
          '**Props**: `variant` (`default` | `toggle`, default `default`), `color` (`filled` | `tonal` | `outlined` | `standard`, default `standard`), `size` (`extra-small` | `small` | `medium` | `large` | `extra-large`, default `small`), `width` (`narrow` | `default` | `wide`, default `default`), `shape` (`round` | `square`, default `round`), `nativeType` (`button` | `submit` | `reset`, default `button`), required `tooltip`, `selected`, `disabled`.',
          '',
          '**Slots**: `icon`, `richTooltipContent`.',
          '',
          '**Project extensions**: `loading` (`boolean | number`, `0` is active), `showTooltipOnClick`, `mdSymbolName`.',
          '',
          '**Tokens**: checked against the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z`. Exact official `--md-comp-icon-button-*` properties are the public override surface. Each variant routes container, icon, outline, and state-layer values through component-local rendered variables, while `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract.',
          '',
          '**Toggle semantics**: `variant="toggle"` exposes controlled `aria-pressed` from `selected` and morphs the icon fill/shape on select, per Material outlined-to-filled toggle guidance.',
          '',
          '**Invalid combination**: `selected` with `variant="default"` is ignored and logs a development warning.',
          '',
          '**Target area**: `extra-small` and `small` sizes keep a 48dp minimum hit target via a private `--md-private-icon-button-target-size` implementation variable (no official component-token path exists for it).',
          '',
          '**Outlined outline width**: scales by size per `md.comp.icon-button.<size>.outlined.outline.width` (xsmall/small/medium 1dp, large 2dp, xlarge 3dp). The outlined interaction contract exposes one official outline-color token, `--md-comp-icon-button-outlined-outline-color`; hover, focus, and pressed vary icon and state-layer values, not the outline token name.',
          '',
          '**Disabled precedence**: disabled selected-toggle controls explicitly exclude the active hover/focus/pressed and selected-color selectors so a higher-specificity `.md-icon-button_selected` rule cannot outrank `:disabled`.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDIconButton>;

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

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDIconButton tooltip="Standard" md-symbol-name="more_vert" />
          <MDIconButton tooltip="Filled" color="filled" md-symbol-name="favorite" />
          <MDIconButton tooltip="Outlined" color="outlined" md-symbol-name="edit" />
        </div>
        <div class="visual-row">
          <MDIconButton tooltip="Tonal" color="tonal" md-symbol-name="bookmark" />
          <MDIconButton tooltip="Selected toggle" variant="toggle" selected md-symbol-name="check" />
          <MDIconButton tooltip="Disabled standard" disabled md-symbol-name="block" />
        </div>
        <div class="visual-row">
          <MDIconButton tooltip="Disabled standard toggle" variant="toggle" disabled md-symbol-name="bookmark" />
          <MDIconButton tooltip="Disabled standard toggle selected" variant="toggle" selected disabled md-symbol-name="bookmark" />
          <MDIconButton tooltip="Disabled filled toggle selected" variant="toggle" selected color="filled" disabled md-symbol-name="favorite" />
        </div>
        <div class="visual-row">
          <MDIconButton tooltip="Disabled tonal toggle selected" variant="toggle" selected color="tonal" disabled md-symbol-name="bookmark" />
          <MDIconButton tooltip="Disabled outlined toggle selected" variant="toggle" selected color="outlined" disabled md-symbol-name="edit" />
          <MDIconButton tooltip="Disabled outlined" color="outlined" disabled md-symbol-name="edit" />
        </div>
        <div class="visual-row">
          <MDIconButton tooltip="Disabled filled" color="filled" disabled md-symbol-name="favorite" />
          <MDIconButton tooltip="Disabled tonal" color="tonal" disabled md-symbol-name="bookmark" />
        </div>
        <div data-testid="visual-md-icon-button-targets" class="visual-row">
          <MDIconButton tooltip="Extra small target" size="extra-small" md-symbol-name="add" />
          <MDIconButton tooltip="Small target" size="small" md-symbol-name="add" />
        </div>
      </div>
    `,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDIconButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-icon-button-interaction-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDIconButton class="md-state_hover" tooltip="Standard hover" md-symbol-name="add" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDIconButton class="md-state_focused" tooltip="Standard focus" md-symbol-name="add" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDIconButton class="md-state_pressed" tooltip="Standard pressed" md-symbol-name="add" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDIconButton class="md-state_hover" tooltip="Filled hover" color="filled" md-symbol-name="favorite" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDIconButton class="md-state_focused" tooltip="Filled focus" color="filled" md-symbol-name="favorite" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDIconButton class="md-state_pressed" tooltip="Filled pressed" color="filled" md-symbol-name="favorite" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDIconButton class="md-state_hover" tooltip="Tonal hover" color="tonal" md-symbol-name="bookmark" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDIconButton class="md-state_focused" tooltip="Tonal focus" color="tonal" md-symbol-name="bookmark" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDIconButton class="md-state_pressed" tooltip="Tonal pressed" color="tonal" md-symbol-name="bookmark" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDIconButton class="md-state_hover" tooltip="Outlined hover" color="outlined" md-symbol-name="edit" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDIconButton class="md-state_focused" tooltip="Outlined focus" color="outlined" md-symbol-name="edit" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDIconButton class="md-state_pressed" tooltip="Outlined pressed" color="outlined" md-symbol-name="edit" /></MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

export const CompactToolbarLayout: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDIconButtonToolbarVisualStory },
    template: '<MDIconButtonToolbarVisualStory />',
  }),
};

export const ExpandedTargetHitArea: Story = {
  render: () => ({
    components: { MDIconButtonTargetHitVisualStory },
    template: '<MDIconButtonTargetHitVisualStory />',
  }),
};

export const Geometry: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDIconButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-icon-button-geometry" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDIconButton data-testid="geometry-width-narrow" tooltip="Narrow" width="narrow" md-symbol-name="edit" />
          <MDIconButton data-testid="geometry-width-default" tooltip="Default width" width="default" md-symbol-name="edit" />
          <MDIconButton data-testid="geometry-width-wide" tooltip="Wide" width="wide" md-symbol-name="edit" />
        </div>
        <div class="visual-row">
          <MDIconButton data-testid="geometry-shape-round" tooltip="Round" shape="round" color="tonal" md-symbol-name="edit" />
          <MDIconButton data-testid="geometry-shape-square" tooltip="Square" shape="square" color="tonal" md-symbol-name="edit" />
        </div>
        <div class="visual-row">
          <MDIconButton data-testid="geometry-round-selected" tooltip="Round selected" variant="toggle" shape="round" selected color="tonal" md-symbol-name="check" />
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton data-testid="geometry-round-pressed" class="md-state_pressed" tooltip="Round pressed" shape="round" color="tonal" md-symbol-name="check" />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton data-testid="geometry-round-selected-pressed" class="md-state_pressed" tooltip="Round selected pressed" variant="toggle" shape="round" selected color="tonal" md-symbol-name="check" />
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

/** Every documented `MDIconButton` size, in ascending order, for table-driven geometry coverage. */
const ICON_BUTTON_SIZES = ['extra-small', 'small', 'medium', 'large', 'extra-large'] as const;

export const SizeGeometryMatrix: Story = {
  render: () => ({
    components: { MDIconButton },
    setup() {
      return { ICON_BUTTON_SIZES };
    },
    template: `
      <div data-testid="visual-md-icon-button-size-geometry" class="visual-checker-backdrop">
        <div v-for="size in ICON_BUTTON_SIZES" :key="size" class="visual-row">
          <MDIconButton :data-testid="\`icon-geometry-\${size}-default\`" :tooltip="size" :size="size" width="default" md-symbol-name="edit" />
          <MDIconButton :data-testid="\`icon-geometry-\${size}-narrow\`" :tooltip="size" :size="size" width="narrow" md-symbol-name="edit" />
          <MDIconButton :data-testid="\`icon-geometry-\${size}-wide\`" :tooltip="size" :size="size" width="wide" md-symbol-name="edit" />
          <MDIconButton :data-testid="\`icon-geometry-\${size}-square\`" :tooltip="size" :size="size" shape="square" md-symbol-name="edit" />
          <MDIconButton :data-testid="\`icon-geometry-\${size}-pressed\`" class="md-state_pressed" :tooltip="size" :size="size" shape="round" md-symbol-name="edit" />
          <MDIconButton :data-testid="\`icon-geometry-\${size}-selected-round\`" :tooltip="size" :size="size" shape="round" variant="toggle" selected color="tonal" md-symbol-name="check" />
          <MDIconButton :data-testid="\`icon-geometry-\${size}-selected-square\`" :tooltip="size" :size="size" shape="square" variant="toggle" selected color="tonal" md-symbol-name="check" />
          <MDIconButton :data-testid="\`icon-geometry-\${size}-outlined\`" :tooltip="size" :size="size" color="outlined" md-symbol-name="edit" />
        </div>
      </div>
    `,
  }),
};

export const ToggleInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDIconButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-icon-button-toggle-interaction-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDIconButton tooltip="Unselected" variant="toggle" color="tonal" md-symbol-name="bookmark" />
          <MDIconButton tooltip="Selected" variant="toggle" selected color="tonal" md-symbol-name="bookmark" />
          <MDStateLayerForcedStateProvider hovered>
            <MDIconButton class="md-state_hover" tooltip="Selected hover" variant="toggle" selected color="tonal" md-symbol-name="bookmark" />
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider focused>
            <MDIconButton class="md-state_focused" tooltip="Selected focus" variant="toggle" selected color="tonal" md-symbol-name="bookmark" />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton class="md-state_pressed" tooltip="Selected pressed" variant="toggle" selected color="tonal" md-symbol-name="bookmark" />
          </MDStateLayerForcedStateProvider>
          <MDIconButton tooltip="Disabled selected" variant="toggle" selected disabled color="tonal" md-symbol-name="bookmark" />
        </div>
      </div>
    `,
  }),
};

export const FocusIndicatorTarget: Story = {
  decorators: [withCheckerboard],
  render: () => ({
    components: { MDIconButton },
    setup() {
      useFocusIndicator();
    },
    template: `
      <div id="visual-md-icon-button-focus-indicator" style="position: fixed; inset: auto 12px 12px auto;">
        <MDIconButton id="storybook-md-icon-button-focus" tooltip="Focus target" color="filled" md-symbol-name="favorite" />
      </div>
    `,
  }),
};

export const DisabledStatePrecedence: Story = {
  render: () => ({
    components: { MDIconButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-icon-button-disabled-state-precedence" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDIconButton data-testid="disabled-resting" tooltip="Disabled outlined" color="outlined" disabled md-symbol-name="edit" />
          <MDStateLayerForcedStateProvider hovered>
            <MDIconButton data-testid="disabled-hover" class="md-state_hover" tooltip="Disabled outlined hover" color="outlined" disabled md-symbol-name="edit" />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDIconButton data-testid="disabled-focus" class="md-state_focused" tooltip="Disabled outlined focus" color="outlined" disabled md-symbol-name="edit" />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton data-testid="disabled-pressed" class="md-state_pressed" tooltip="Disabled outlined pressed" color="outlined" disabled md-symbol-name="edit" />
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

export const OutlinedOutlineWidths: Story = {
  render: () => ({
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-outline-widths" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDIconButton data-testid="outline-width-small" tooltip="Small outlined" color="outlined" size="small" md-symbol-name="edit" />
          <MDIconButton data-testid="outline-width-large" tooltip="Large outlined" color="outlined" size="large" md-symbol-name="edit" />
          <MDIconButton data-testid="outline-width-extra-large" tooltip="Extra large outlined" color="outlined" size="extra-large" md-symbol-name="edit" />
        </div>
      </div>
    `,
  }),
};

export const TokenRoutingMatrix: Story = {
  render: () => ({
    components: { MDIconButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-icon-button-token-routing" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
            <MDIconButton
              data-testid="icon-button-hover"
              class="md-state_hover"
              tooltip="Filled hover"
              color="filled"
              md-symbol-name="favorite"
              style="
                --md-comp-icon-button-filled-hovered-icon-color: rgb(255 0 0);
                --md-comp-icon-button-filled-hovered-state-layer-color: rgb(0 200 200);
                --md-comp-icon-button-filled-hovered-state-layer-opacity: 0.03;
              "
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDIconButton
              data-testid="icon-button-focus"
              class="md-state_focused"
              tooltip="Filled focus"
              color="filled"
              md-symbol-name="favorite"
              style="
                --md-comp-icon-button-filled-focused-icon-color: rgb(0 128 0);
                --md-comp-icon-button-filled-focused-state-layer-color: rgb(200 0 200);
                --md-comp-icon-button-filled-focused-state-layer-opacity: 0.17;
              "
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton
              data-testid="icon-button-pressed"
              class="md-state_pressed"
              tooltip="Filled pressed"
              color="filled"
              md-symbol-name="favorite"
              style="
                --md-comp-icon-button-filled-pressed-icon-color: rgb(0 0 255);
                --md-comp-icon-button-filled-pressed-state-layer-color: rgb(200 120 0);
                --md-comp-icon-button-filled-pressed-state-layer-opacity: 0.29;
              "
            />
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
            <MDIconButton
              data-testid="icon-button-tonal-hover"
              class="md-state_hover"
              tooltip="Tonal hover"
              color="tonal"
              md-symbol-name="bookmark"
              style="
                --md-comp-icon-button-tonal-hovered-icon-color: rgb(255 0 0);
                --md-comp-icon-button-tonal-hovered-state-layer-color: rgb(0 200 200);
                --md-comp-icon-button-tonal-hovered-state-layer-opacity: 0.03;
              "
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDIconButton
              data-testid="icon-button-tonal-focus"
              class="md-state_focused"
              tooltip="Tonal focus"
              color="tonal"
              md-symbol-name="bookmark"
              style="
                --md-comp-icon-button-tonal-focused-icon-color: rgb(0 128 0);
                --md-comp-icon-button-tonal-focused-state-layer-color: rgb(200 0 200);
                --md-comp-icon-button-tonal-focused-state-layer-opacity: 0.17;
              "
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton
              data-testid="icon-button-tonal-pressed"
              class="md-state_pressed"
              tooltip="Tonal pressed"
              color="tonal"
              md-symbol-name="bookmark"
              style="
                --md-comp-icon-button-tonal-pressed-icon-color: rgb(0 0 255);
                --md-comp-icon-button-tonal-pressed-state-layer-color: rgb(200 120 0);
                --md-comp-icon-button-tonal-pressed-state-layer-opacity: 0.29;
              "
            />
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
            <MDIconButton
              data-testid="icon-button-outlined-hover"
              class="md-state_hover"
              tooltip="Outlined hover"
              color="outlined"
              md-symbol-name="edit"
              style="
                --md-comp-icon-button-outlined-outline-color: rgb(120 10 10);
                --md-comp-icon-button-outlined-hovered-state-layer-color: rgb(0 200 200);
                --md-comp-icon-button-outlined-hovered-state-layer-opacity: 0.03;
              "
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDIconButton
              data-testid="icon-button-outlined-focus"
              class="md-state_focused"
              tooltip="Outlined focus"
              color="outlined"
              md-symbol-name="edit"
              style="
                --md-comp-icon-button-outlined-outline-color: rgb(120 10 10);
                --md-comp-icon-button-outlined-focused-icon-color: rgb(10 120 10);
                --md-comp-icon-button-outlined-focused-state-layer-color: rgb(200 0 200);
                --md-comp-icon-button-outlined-focused-state-layer-opacity: 0.17;
              "
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton
              data-testid="icon-button-outlined-pressed"
              class="md-state_pressed"
              tooltip="Outlined pressed"
              color="outlined"
              md-symbol-name="edit"
              style="
                --md-comp-icon-button-outlined-outline-color: rgb(120 10 10);
                --md-comp-icon-button-outlined-pressed-icon-color: rgb(10 10 120);
                --md-comp-icon-button-outlined-pressed-state-layer-color: rgb(200 120 0);
                --md-comp-icon-button-outlined-pressed-state-layer-opacity: 0.29;
              "
            />
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDIconButton
            data-testid="icon-button-outlined-unselected"
            tooltip="Outlined unselected"
            variant="toggle"
            color="outlined"
            md-symbol-name="edit"
            style="--md-comp-icon-button-outlined-unselected-outline-color: rgb(120 10 10);"
          />
          <MDIconButton
            data-testid="icon-button-outlined-selected"
            tooltip="Outlined selected"
            variant="toggle"
            selected
            color="outlined"
            md-symbol-name="edit"
            style="--md-comp-icon-button-outlined-selected-container-color: rgb(10 120 10);"
          />
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton
              data-testid="icon-button-selected-pressed"
              class="md-state_pressed"
              tooltip="Standard selected pressed"
              variant="toggle"
              selected
              md-symbol-name="bookmark"
              style="
                --md-comp-icon-button-standard-selected-pressed-icon-color: rgb(180 0 180);
                --md-comp-icon-button-standard-selected-pressed-state-layer-color: rgb(180 0 0);
                --md-comp-icon-button-standard-pressed-state-layer-opacity: 0.11;
              "
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDIconButton
              data-testid="icon-button-unselected-pressed"
              class="md-state_pressed"
              tooltip="Standard unselected pressed"
              variant="toggle"
              md-symbol-name="bookmark"
              style="
                --md-comp-icon-button-standard-unselected-pressed-icon-color: rgb(0 90 0);
                --md-comp-icon-button-standard-unselected-pressed-state-layer-color: rgb(0 0 180);
                --md-comp-icon-button-standard-pressed-state-layer-opacity: 0.21;
              "
            />
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

/** The four IconButton styles publishing distinct selected/unselected Material color tokens. */
const ICON_BUTTON_TOGGLE_STYLES = ['standard', 'filled', 'tonal', 'outlined'] as const;
type IconButtonToggleStyle = (typeof ICON_BUTTON_TOGGLE_STYLES)[number];

interface IconButtonToggleBranchTokens {
  /** Resting container color. Omitted where the style publishes none (standard, outlined unselected). */
  container?: string;
  /** Resting icon color. */
  icon: string;
  /** Hover-forced icon color. */
  hoverIcon: string;
  /** Hover-forced state-layer color. */
  stateLayerColor: string;
  /** Resting outline color. Only `outlined` publishes a per-branch outline token. */
  outline?: string;
}

/**
 * Deterministic, hand-written override values proving that selected and unselected container,
 * icon, and (hover-forced) state-layer color route independently per IconButton style, plus
 * outline for `outlined` (read at rest — `MDIconButton.vue` has no selected/unselected outline
 * token at all, only the one shared base outline). Every literal is unique within its own branch.
 * Test-local fixture data, not a production token table.
 */
const ICON_BUTTON_TOGGLE_MATRIX: Record<
  IconButtonToggleStyle,
  {
    selected: IconButtonToggleBranchTokens;
    unselected: IconButtonToggleBranchTokens;
    hoverOpacity: string;
  }
> = {
  standard: {
    selected: {
      icon: 'rgb(210 90 0)',
      hoverIcon: 'rgb(210 90 40)',
      stateLayerColor: 'rgb(0 150 210)',
    },
    unselected: {
      icon: 'rgb(0 140 70)',
      hoverIcon: 'rgb(40 140 70)',
      stateLayerColor: 'rgb(150 0 90)',
    },
    hoverOpacity: '0.07',
  },
  filled: {
    selected: {
      container: 'rgb(10 60 10)',
      icon: 'rgb(255 210 0)',
      hoverIcon: 'rgb(255 230 60)',
      stateLayerColor: 'rgb(0 200 160)',
    },
    unselected: {
      container: 'rgb(10 10 90)',
      icon: 'rgb(255 120 180)',
      hoverIcon: 'rgb(255 150 200)',
      stateLayerColor: 'rgb(150 80 0)',
    },
    hoverOpacity: '0.09',
  },
  tonal: {
    selected: {
      container: 'rgb(90 60 10)',
      icon: 'rgb(255 255 0)',
      hoverIcon: 'rgb(255 255 90)',
      stateLayerColor: 'rgb(200 100 0)',
    },
    unselected: {
      container: 'rgb(10 90 60)',
      icon: 'rgb(0 255 255)',
      hoverIcon: 'rgb(90 255 255)',
      stateLayerColor: 'rgb(0 120 200)',
    },
    hoverOpacity: '0.13',
  },
  outlined: {
    // `outlined` selected has no independent outline token in `MDIconButton.vue`: its outline is
    // routed to mirror `selected-container-color` so the border blends into the filled selected
    // container, so `outline` is intentionally omitted here (not independently routed).
    selected: {
      container: 'rgb(60 10 90)',
      icon: 'rgb(255 0 150)',
      hoverIcon: 'rgb(255 60 180)',
      stateLayerColor: 'rgb(150 0 255)',
    },
    unselected: {
      icon: 'rgb(0 255 120)',
      hoverIcon: 'rgb(60 255 150)',
      stateLayerColor: 'rgb(0 90 255)',
      outline: 'rgb(90 60 0)',
    },
    hoverOpacity: '0.15',
  },
};

const iconButtonToggleRestingStyle = (
  style: IconButtonToggleStyle,
  branch: 'selected' | 'unselected',
) => {
  const tokens = ICON_BUTTON_TOGGLE_MATRIX[style][branch];
  const restingStyle: Record<string, string> = {
    [`--md-comp-icon-button-${style}-${branch}-icon-color`]: tokens.icon,
  };
  if (tokens.container !== undefined) {
    restingStyle[`--md-comp-icon-button-${style}-${branch}-container-color`] = tokens.container;
  }
  if (tokens.outline !== undefined) {
    restingStyle[`--md-comp-icon-button-${style}-${branch}-outline-color`] = tokens.outline;
  }
  return restingStyle;
};

const iconButtonToggleHoverStyle = (
  style: IconButtonToggleStyle,
  branch: 'selected' | 'unselected',
) => {
  const entry = ICON_BUTTON_TOGGLE_MATRIX[style];
  const tokens = entry[branch];
  return {
    [`--md-comp-icon-button-${style}-hovered-state-layer-opacity`]: entry.hoverOpacity,
    [`--md-comp-icon-button-${style}-${branch}-hovered-icon-color`]: tokens.hoverIcon,
    [`--md-comp-icon-button-${style}-${branch}-hovered-state-layer-color`]: tokens.stateLayerColor,
  };
};

export const ToggleTokenRoutingMatrix: Story = {
  render: () => ({
    components: { MDIconButton, MDStateLayerForcedStateProvider },
    setup() {
      return {
        ICON_BUTTON_TOGGLE_STYLES,
        iconButtonToggleRestingStyle,
        iconButtonToggleHoverStyle,
      };
    },
    template: `
      <div data-testid="visual-md-icon-button-toggle-token-routing" class="visual-checker-backdrop">
        <div v-for="style in ICON_BUTTON_TOGGLE_STYLES" :key="style" class="visual-row">
          <MDIconButton
            :data-testid="\`icon-toggle-token-\${style}-selected-resting\`"
            :tooltip="\`\${style} selected\`"
            variant="toggle"
            selected
            :color="style"
            md-symbol-name="check"
            :style="iconButtonToggleRestingStyle(style, 'selected')"
          />
          <MDIconButton
            :data-testid="\`icon-toggle-token-\${style}-unselected-resting\`"
            :tooltip="\`\${style} unselected\`"
            variant="toggle"
            :color="style"
            md-symbol-name="check"
            :style="iconButtonToggleRestingStyle(style, 'unselected')"
          />
          <MDStateLayerForcedStateProvider hovered>
            <MDIconButton
              :data-testid="\`icon-toggle-token-\${style}-selected-hover\`"
              class="md-state_hover"
              :tooltip="\`\${style} selected hover\`"
              variant="toggle"
              selected
              :color="style"
              md-symbol-name="check"
              :style="iconButtonToggleHoverStyle(style, 'selected')"
            />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider hovered>
            <MDIconButton
              :data-testid="\`icon-toggle-token-\${style}-unselected-hover\`"
              class="md-state_hover"
              :tooltip="\`\${style} unselected hover\`"
              variant="toggle"
              :color="style"
              md-symbol-name="check"
              :style="iconButtonToggleHoverStyle(style, 'unselected')"
            />
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

export const DenseToolbarInteraction: Story = {
  render: () => ({
    components: { MDIconButtonToolbarInteractionStory },
    template: '<MDIconButtonToolbarInteractionStory />',
  }),
};

export const LoadingColorRouting: Story = {
  render: () => ({
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-loading-color-routing" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDIconButton
            data-testid="icon-button-resting-color"
            tooltip="Loading"
            color="filled"
            md-symbol-name="favorite"
            style="--md-comp-icon-button-filled-icon-color: rgb(12 34 56);"
          />
          <MDIconButton
            data-testid="icon-button-loading-color"
            tooltip="Loading"
            color="filled"
            loading
            md-symbol-name="favorite"
            style="--md-comp-icon-button-filled-icon-color: rgb(12 34 56);"
          />
        </div>
      </div>
    `,
  }),
};
