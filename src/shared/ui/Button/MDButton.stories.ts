import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDButton from './MDButton.vue';
import MDButtonTargetHitVisualStory from './MDButtonTargetHitVisualStory.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDButton',
  component: MDButton,
  args: {
    label: 'Save',
    color: 'filled',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'Checked against Material 3 `components/buttons/{overview,guidelines,specs,accessibility}`.',
          '',
          '**Props**: `variant` (`default` | `toggle`, default `default`), `color` (`elevated` | `filled` | `tonal` | `outlined` | `text`, default `filled`), `size` (`extra-small` | `small` | `medium` | `large` | `extra-large`, default `small`), `shape` (`round` | `square`, default `round`), `nativeType` (`button` | `submit` | `reset`, default `button`), `label` (required), `selected`, `disabled`, `loading` (project extension: `boolean | number`, `0` is an active loading state).',
          '',
          '**Slots**: `icon` (leading icon).',
          '',
          '**Emits**: `click` (native click, not synthesized).',
          '',
          '**Tokens**: `--md-comp-button-*` component tokens resolve to `--md-sys-*`, with distinct leading-space/trailing-space/icon-label-space/container-shape/outlined-outline-width tokens per size; see the component styles for the full surface.',
          '',
          '**Typography**: the label uses the shared `MD_TYPESCALE` utility classes (no handwritten font CSS). `md.comp.button.<size>.label-text` is a composite official token with no exact decomposed `--md-comp-*` path, so it is documented here rather than split into invented font/size/line-height/weight/tracking fragments: `xsmall`/`small`→label-large, `medium`→title-medium, `large`→headline-small, `xlarge`→headline-large.',
          '',
          '**Toggle semantics**: `variant="toggle"` exposes controlled `aria-pressed` from `selected`. The consumer owns `selected` state; clicking only emits `click`.',
          '',
          '**Invalid combination**: `selected` with `variant="default"` is ignored (not rendered as selected) and logs a development warning.',
          '',
          '**Target area**: `extra-small` and `small` sizes keep a 48dp minimum hit target via `.md-button__target`.',
          '',
          "**Toggle shape**: selected toggle buttons morph container shape per size (round input shape morphs to the size's square corner token, square input shape morphs to a fully-rounded corner token); the pressed shape always takes precedence over the selected shape. Disabled selected-toggle buttons explicitly exclude the selected-color selector so a higher-specificity `.md-button_selected` rule cannot outrank `:disabled`.",
          '',
          '**Text toggle**: `variant="toggle"` with `color="text"` is supported (Material 3 guidelines list text buttons among the five toggle-capable styles). `md.comp.button.text` has no dedicated `selected`/`unselected` color tokens, so a selected text toggle keeps its default label/icon color and only the shape and `aria-pressed` change.',
          '',
          '**Text spacing**: text buttons use the same per-size `leading-space`/`trailing-space` tokens as every other color style (no fixed small-size padding override).',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Toggle: Story = {
  args: {
    variant: 'toggle',
    selected: true,
    color: 'tonal',
    label: 'Bookmark',
  },
};

export const ToggleText: Story = {
  args: {
    variant: 'toggle',
    selected: true,
    color: 'text',
    label: 'Bookmark',
  },
};

export const ToggleShapes: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-toggle-shapes" class="visual-surface">
        <div class="visual-row">
          <MDButton data-testid="toggle-round-selected" label="Round selected" variant="toggle" shape="round" selected color="tonal" />
          <MDButton data-testid="toggle-round-unselected" label="Round unselected" variant="toggle" shape="round" color="tonal" />
        </div>
        <div class="visual-row">
          <MDButton data-testid="toggle-square-selected" label="Square selected" variant="toggle" shape="square" selected color="tonal" />
          <MDButton data-testid="toggle-square-unselected" label="Square unselected" variant="toggle" shape="square" color="tonal" />
        </div>
      </div>
    `,
  }),
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-states" class="visual-surface">
        <div class="visual-row">
          <MDButton label="Filled" color="filled" />
          <MDButton label="Outlined" color="outlined" />
          <MDButton label="Text" color="text" />
        </div>
        <div class="visual-row">
          <MDButton label="Tonal" color="tonal" />
          <MDButton label="Elevated" color="elevated" />
          <MDButton label="Disabled elevated" color="elevated" disabled />
        </div>
        <div class="visual-row">
          <MDButton label="Disabled filled" color="filled" disabled />
          <MDButton label="Disabled tonal" color="tonal" disabled />
          <MDButton label="Disabled outlined" color="outlined" disabled />
          <MDButton label="Disabled text" color="text" disabled />
        </div>
      </div>
    `,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-interaction-states" class="visual-surface">
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Hover" color="filled" />
          <MDButton class="md-state_focused" label="Focus" color="outlined" />
          <MDButton class="md-state_pressed" label="Pressed" color="tonal" />
        </div>
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Outlined hover" color="outlined" />
          <MDButton class="md-state_focused" label="Outlined focus" color="outlined" />
          <MDButton class="md-state_pressed" label="Outlined pressed" color="outlined" />
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

export const SizeTypography: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-size-typography" class="visual-surface">
        <div class="visual-row">
          <MDButton data-testid="typography-small" label="Small" size="small" />
          <MDButton data-testid="typography-medium" label="Medium" size="medium" />
          <MDButton data-testid="typography-large" label="Large" size="large" />
          <MDButton data-testid="typography-extra-large" label="Extra large" size="extra-large" />
        </div>
      </div>
    `,
  }),
};

export const DisabledHoverStates: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-disabled-hover" class="visual-surface">
        <div class="visual-row">
          <MDButton data-testid="disabled-elevated-hover" class="md-state_hover" label="Disabled elevated" color="elevated" disabled />
          <MDButton data-testid="disabled-outlined-hover" class="md-state_hover" label="Disabled outlined" color="outlined" disabled />
          <MDButton data-testid="disabled-outlined-focus" class="md-state_focused" label="Disabled outlined focus" color="outlined" disabled />
        </div>
      </div>
    `,
  }),
};

export const TextButtonSpacing: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-text-spacing" class="visual-surface">
        <div class="visual-row">
          <MDButton data-testid="text-spacing-small" label="Small" color="text" size="small" />
          <MDButton data-testid="text-spacing-medium" label="Medium" color="text" size="medium" />
          <MDButton data-testid="text-spacing-large" label="Large" color="text" size="large" />
          <MDButton data-testid="text-spacing-extra-large" label="Extra large" color="text" size="extra-large" />
          <MDButton data-testid="text-spacing-small-icon" label="With icon" color="text" size="small">
            <template #icon>+</template>
          </MDButton>
        </div>
      </div>
    `,
  }),
};

export const ToggleStateLayerColors: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-toggle-state-layer" class="visual-surface">
        <div class="visual-row">
          <MDButton data-testid="filled-toggle-unselected-hover" class="md-state_hover" label="Filled unselected hover" variant="toggle" color="filled" />
          <MDButton data-testid="filled-toggle-selected-hover" class="md-state_hover" label="Filled selected hover" variant="toggle" color="filled" selected />
          <MDButton data-testid="outlined-toggle-unselected-focus" class="md-state_focused" label="Outlined unselected focus" variant="toggle" color="outlined" />
          <MDButton data-testid="outlined-toggle-selected-focus" class="md-state_focused" label="Outlined selected focus" variant="toggle" color="outlined" selected />
        </div>
      </div>
    `,
  }),
};

export const TargetLayers: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-targets" class="visual-surface">
        <div class="visual-row">
          <MDButton label="XS target" size="extra-small" />
          <MDButton label="S target" size="small" />
        </div>
      </div>
    `,
  }),
};
