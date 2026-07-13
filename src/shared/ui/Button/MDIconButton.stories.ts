import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDIconButton from './MDIconButton.vue';
import MDIconButtonTargetHitVisualStory from './MDIconButtonTargetHitVisualStory.vue';
import MDIconButtonToolbarInteractionStory from './MDIconButtonToolbarInteractionStory.vue';
import MDIconButtonToolbarVisualStory from './MDIconButtonToolbarVisualStory.vue';

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
          '**Tokens**: checked against the Material 3 MCP/cache snapshot captured 2026-06-30. Exact official `--md-comp-icon-button-*` properties are the public override surface. Each variant routes container, icon, outline, and state-layer values through component-local rendered variables, while `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract.',
          '',
          '**Toggle semantics**: `variant="toggle"` exposes controlled `aria-pressed` from `selected` and morphs the icon fill/shape on select, per Material outlined-to-filled toggle guidance.',
          '',
          '**Invalid combination**: `selected` with `variant="default"` is ignored and logs a development warning.',
          '',
          '**Target area**: `extra-small` and `small` sizes keep a 48dp minimum hit target via a private `--md-private-icon-button-target-size` implementation variable (no official component-token path exists for it).',
          '',
          '**Outlined outline width**: scales by size per `md.comp.icon-button.<size>.outlined.outline.width` (xsmall/small/medium 1dp, large 2dp, xlarge 3dp).',
          '',
          '**Disabled precedence**: disabled selected-toggle controls explicitly exclude the active hover/focus/pressed and selected-color selectors so a higher-specificity `.md-icon-button_selected` rule cannot outrank `:disabled`.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDIconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-states" class="visual-surface">
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
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-interaction-states" class="visual-surface">
        <div class="visual-row">
          <MDIconButton class="md-state_hover" tooltip="Hover" md-symbol-name="add" />
          <MDIconButton class="md-state_focused" tooltip="Focus" color="filled" md-symbol-name="search" />
          <MDIconButton class="md-state_pressed" tooltip="Pressed" color="outlined" md-symbol-name="share" />
        </div>
        <div class="visual-row">
          <MDIconButton class="md-state_hover" tooltip="Toggle hover" variant="toggle" md-symbol-name="bookmark" />
          <MDIconButton class="md-state_focused" tooltip="Toggle focus selected" variant="toggle" selected md-symbol-name="bookmark" />
          <MDIconButton class="md-state_pressed" tooltip="Toggle pressed selected" variant="toggle" selected color="tonal" md-symbol-name="bookmark" />
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

export const DisabledStatePrecedence: Story = {
  render: () => ({
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-disabled-state-precedence" class="visual-surface">
        <div class="visual-row">
          <MDIconButton data-testid="disabled-resting" tooltip="Disabled outlined" color="outlined" disabled md-symbol-name="edit" />
          <MDIconButton data-testid="disabled-hover" class="md-state_hover" tooltip="Disabled outlined hover" color="outlined" disabled md-symbol-name="edit" />
          <MDIconButton data-testid="disabled-focus" class="md-state_focused" tooltip="Disabled outlined focus" color="outlined" disabled md-symbol-name="edit" />
          <MDIconButton data-testid="disabled-pressed" class="md-state_pressed" tooltip="Disabled outlined pressed" color="outlined" disabled md-symbol-name="edit" />
        </div>
      </div>
    `,
  }),
};

export const OutlinedOutlineWidths: Story = {
  render: () => ({
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-outline-widths" class="visual-surface">
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
    components: { MDIconButton },
    template: `
      <div data-testid="visual-md-icon-button-token-routing" class="visual-surface">
        <div class="visual-row">
          <MDIconButton
            data-testid="icon-button-hover"
            class="md-state_hover"
            tooltip="Filled hover"
            color="filled"
            md-symbol-name="favorite"
            style="
              --md-comp-icon-button-filled-hovered-icon-color: rgb(255 0 0);
              --md-comp-icon-button-filled-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-icon-button-filled-hovered-state-layer-opacity: 0.03;
            "
          />
          <MDIconButton
            data-testid="icon-button-focus"
            class="md-state_focused"
            tooltip="Filled focus"
            color="filled"
            md-symbol-name="favorite"
            style="
              --md-comp-icon-button-filled-focused-icon-color: rgb(0 128 0);
              --md-comp-icon-button-filled-focused-state-layer-color: rgb(0 128 0);
              --md-comp-icon-button-filled-focused-state-layer-opacity: 0.17;
            "
          />
          <MDIconButton
            data-testid="icon-button-pressed"
            class="md-state_pressed"
            tooltip="Filled pressed"
            color="filled"
            md-symbol-name="favorite"
            style="
              --md-comp-icon-button-filled-pressed-icon-color: rgb(0 0 255);
              --md-comp-icon-button-filled-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-icon-button-filled-pressed-state-layer-opacity: 0.29;
            "
          />
        </div>
        <div class="visual-row">
          <MDIconButton
            data-testid="icon-button-outlined-hover"
            class="md-state_hover"
            tooltip="Outlined hover"
            color="outlined"
            md-symbol-name="edit"
            style="
              --md-comp-icon-button-outlined-hovered-outline-color: rgb(120 10 10);
              --md-comp-icon-button-outlined-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-icon-button-outlined-hovered-state-layer-opacity: 0.03;
            "
          />
          <MDIconButton
            data-testid="icon-button-outlined-focus"
            class="md-state_focused"
            tooltip="Outlined focus"
            color="outlined"
            md-symbol-name="edit"
            style="
              --md-comp-icon-button-outlined-focused-outline-color: rgb(10 120 10);
              --md-comp-icon-button-outlined-focused-state-layer-color: rgb(0 128 0);
              --md-comp-icon-button-outlined-focused-state-layer-opacity: 0.17;
            "
          />
          <MDIconButton
            data-testid="icon-button-outlined-pressed"
            class="md-state_pressed"
            tooltip="Outlined pressed"
            color="outlined"
            md-symbol-name="edit"
            style="
              --md-comp-icon-button-outlined-pressed-outline-color: rgb(10 10 120);
              --md-comp-icon-button-outlined-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-icon-button-outlined-pressed-state-layer-opacity: 0.29;
            "
          />
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
