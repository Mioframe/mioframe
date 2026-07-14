import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDButton from './MDButton.vue';
import MDButtonTargetHitVisualStory from './MDButtonTargetHitVisualStory.vue';
import { useFocusIndicator } from '../State/useFocusIndicator';

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
          '**Tokens**: checked against the `material3` MCP snapshot captured at `2026-06-30T05:53:04.916Z`. Exact official `--md-comp-button-*` properties are the public override surface. Each state and variant routes through component-local rendered variables for container, label, icon, outline, elevation, and state-layer color, while `MDStateLayer` continues to consume only the generic `--md-private-state-*` contract.',
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
          <MDButton data-testid="toggle-round-pressed" class="md-state_pressed" label="Round pressed" shape="round" color="tonal" />
          <MDButton data-testid="toggle-round-selected-pressed" class="md-state_pressed" label="Round selected pressed" variant="toggle" shape="round" selected color="tonal" />
        </div>
        <div class="visual-row">
          <MDButton data-testid="toggle-square-selected" label="Square selected" variant="toggle" shape="square" selected color="tonal" />
          <MDButton data-testid="toggle-square-unselected" label="Square unselected" variant="toggle" shape="square" color="tonal" />
        </div>
      </div>
    `,
  }),
};

export const ToggleInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-toggle-interaction-states" class="visual-surface">
        <div class="visual-row">
          <MDButton label="Unselected" variant="toggle" color="tonal">
            <template #icon>+</template>
          </MDButton>
          <MDButton label="Selected" variant="toggle" selected color="tonal">
            <template #icon>+</template>
          </MDButton>
          <MDButton class="md-state_hover" label="Selected hover" variant="toggle" selected color="tonal">
            <template #icon>+</template>
          </MDButton>
        </div>
        <div class="visual-row">
          <MDButton class="md-state_focused" label="Selected focus" variant="toggle" selected color="tonal">
            <template #icon>+</template>
          </MDButton>
          <MDButton class="md-state_pressed" label="Selected pressed" variant="toggle" selected color="tonal">
            <template #icon>+</template>
          </MDButton>
          <MDButton label="Disabled selected" variant="toggle" selected disabled color="tonal">
            <template #icon>+</template>
          </MDButton>
        </div>
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
      <div id="visual-md-button-focus-indicator" style="position: fixed; inset: auto 12px 12px auto;">
        <MDButton id="storybook-md-button-focus" label="Focus target" color="filled" />
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
          <MDButton class="md-state_hover" label="Elevated hover" color="elevated" />
          <MDButton class="md-state_focused" label="Elevated focus" color="elevated" />
          <MDButton class="md-state_pressed" label="Elevated pressed" color="elevated" />
        </div>
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Filled hover" color="filled" />
          <MDButton class="md-state_focused" label="Filled focus" color="filled" />
          <MDButton class="md-state_pressed" label="Filled pressed" color="filled" />
        </div>
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Tonal hover" color="tonal" />
          <MDButton class="md-state_focused" label="Tonal focus" color="tonal" />
          <MDButton class="md-state_pressed" label="Tonal pressed" color="tonal" />
        </div>
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Outlined hover" color="outlined" />
          <MDButton class="md-state_focused" label="Outlined focus" color="outlined" />
          <MDButton class="md-state_pressed" label="Outlined pressed" color="outlined" />
        </div>
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Text hover" color="text" />
          <MDButton class="md-state_focused" label="Text focus" color="text" />
          <MDButton class="md-state_pressed" label="Text pressed" color="text" />
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

export const DisabledStatePrecedence: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-disabled-state-precedence" class="visual-surface">
        <div class="visual-row">
          <MDButton data-testid="disabled-resting" label="Disabled outlined" color="outlined" disabled>
            <template #icon>+</template>
          </MDButton>
          <MDButton data-testid="disabled-hover" class="md-state_hover" label="Disabled outlined hover" color="outlined" disabled>
            <template #icon>+</template>
          </MDButton>
          <MDButton data-testid="disabled-focus" class="md-state_focused" label="Disabled outlined focus" color="outlined" disabled>
            <template #icon>+</template>
          </MDButton>
          <MDButton data-testid="disabled-pressed" class="md-state_pressed" label="Disabled outlined pressed" color="outlined" disabled>
            <template #icon>+</template>
          </MDButton>
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

export const TokenRoutingMatrix: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-token-routing" class="visual-surface">
        <div class="visual-row">
          <MDButton
            data-testid="button-hover"
            class="md-state_hover"
            label="Hover"
            color="filled"
            style="
              --md-comp-button-filled-label-text-color: rgb(30 30 30);
              --md-comp-button-filled-hovered-label-text-color: rgb(0 128 0);
              --md-comp-button-filled-icon-color: rgb(90 20 150);
              --md-comp-button-filled-hovered-icon-color: rgb(255 0 0);
              --md-comp-button-filled-hovered-container-elevation: 0 0 0 3px rgb(12 34 56);
              --md-comp-button-filled-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-button-filled-hovered-state-layer-opacity: 0.03;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-focus"
            class="md-state_focused"
            label="Focus"
            color="filled"
            style="
              --md-comp-button-filled-focused-label-text-color: rgb(0 0 255);
              --md-comp-button-filled-focused-icon-color: rgb(255 165 0);
              --md-comp-button-filled-focused-container-elevation: 0 0 0 4px rgb(23 45 67);
              --md-comp-button-filled-focused-state-layer-color: rgb(0 128 0);
              --md-comp-button-filled-focused-state-layer-opacity: 0.17;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-pressed"
            class="md-state_pressed"
            label="Pressed"
            color="filled"
            style="
              --md-comp-button-filled-pressed-label-text-color: rgb(255 0 255);
              --md-comp-button-filled-pressed-icon-color: rgb(0 255 255);
              --md-comp-button-filled-pressed-container-elevation: 0 0 0 5px rgb(34 56 78);
              --md-comp-button-filled-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-button-filled-pressed-state-layer-opacity: 0.29;
            "
          >
            <template #icon>+</template>
          </MDButton>
        </div>
        <div class="visual-row">
          <MDButton
            data-testid="button-outlined-hover"
            class="md-state_hover"
            label="Outlined hover"
            color="outlined"
            style="
              --md-comp-button-outlined-hovered-outline-color: rgb(120 10 10);
              --md-comp-button-outlined-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-button-outlined-hovered-state-layer-opacity: 0.03;
            "
          />
          <MDButton
            data-testid="button-outlined-focus"
            class="md-state_focused"
            label="Outlined focus"
            color="outlined"
            style="
              --md-comp-button-outlined-focused-outline-color: rgb(10 120 10);
              --md-comp-button-outlined-focused-state-layer-color: rgb(0 128 0);
              --md-comp-button-outlined-focused-state-layer-opacity: 0.17;
            "
          />
          <MDButton
            data-testid="button-outlined-pressed"
            class="md-state_pressed"
            label="Outlined pressed"
            color="outlined"
            style="
              --md-comp-button-outlined-pressed-outline-color: rgb(10 10 120);
              --md-comp-button-outlined-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-button-outlined-pressed-state-layer-opacity: 0.29;
            "
          />
        </div>
        <div class="visual-row">
          <MDButton
            data-testid="button-tonal-hover"
            class="md-state_hover"
            label="Tonal hover"
            color="tonal"
            style="
              --md-comp-button-tonal-label-text-color: rgb(30 30 30);
              --md-comp-button-tonal-hovered-label-text-color: rgb(0 128 0);
              --md-comp-button-tonal-icon-color: rgb(90 20 150);
              --md-comp-button-tonal-hovered-icon-color: rgb(255 0 0);
              --md-comp-button-tonal-hovered-container-elevation: 0 0 0 3px rgb(12 34 56);
              --md-comp-button-tonal-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-button-tonal-hovered-state-layer-opacity: 0.03;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-tonal-focus"
            class="md-state_focused"
            label="Tonal focus"
            color="tonal"
            style="
              --md-comp-button-tonal-focused-label-text-color: rgb(0 0 255);
              --md-comp-button-tonal-focused-icon-color: rgb(255 165 0);
              --md-comp-button-tonal-focused-container-elevation: 0 0 0 4px rgb(23 45 67);
              --md-comp-button-tonal-focused-state-layer-color: rgb(0 128 0);
              --md-comp-button-tonal-focused-state-layer-opacity: 0.17;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-tonal-pressed"
            class="md-state_pressed"
            label="Tonal pressed"
            color="tonal"
            style="
              --md-comp-button-tonal-pressed-label-text-color: rgb(255 0 255);
              --md-comp-button-tonal-pressed-icon-color: rgb(0 255 255);
              --md-comp-button-tonal-pressed-container-elevation: 0 0 0 5px rgb(34 56 78);
              --md-comp-button-tonal-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-button-tonal-pressed-state-layer-opacity: 0.29;
            "
          >
            <template #icon>+</template>
          </MDButton>
        </div>
        <div class="visual-row">
          <MDButton
            data-testid="button-elevated-hover"
            class="md-state_hover"
            label="Elevated hover"
            color="elevated"
            style="
              --md-comp-button-elevated-label-text-color: rgb(30 30 30);
              --md-comp-button-elevated-hovered-label-text-color: rgb(0 128 0);
              --md-comp-button-elevated-icon-color: rgb(90 20 150);
              --md-comp-button-elevated-hovered-icon-color: rgb(255 0 0);
              --md-comp-button-elevated-hovered-container-elevation: 0 0 0 3px rgb(12 34 56);
              --md-comp-button-elevated-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-button-elevated-hovered-state-layer-opacity: 0.03;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-elevated-focus"
            class="md-state_focused"
            label="Elevated focus"
            color="elevated"
            style="
              --md-comp-button-elevated-focused-label-text-color: rgb(0 0 255);
              --md-comp-button-elevated-focused-icon-color: rgb(255 165 0);
              --md-comp-button-elevated-focused-container-elevation: 0 0 0 4px rgb(23 45 67);
              --md-comp-button-elevated-focused-state-layer-color: rgb(0 128 0);
              --md-comp-button-elevated-focused-state-layer-opacity: 0.17;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-elevated-pressed"
            class="md-state_pressed"
            label="Elevated pressed"
            color="elevated"
            style="
              --md-comp-button-elevated-pressed-label-text-color: rgb(255 0 255);
              --md-comp-button-elevated-pressed-icon-color: rgb(0 255 255);
              --md-comp-button-elevated-pressed-container-elevation: 0 0 0 5px rgb(34 56 78);
              --md-comp-button-elevated-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-button-elevated-pressed-state-layer-opacity: 0.29;
            "
          >
            <template #icon>+</template>
          </MDButton>
        </div>
        <div class="visual-row">
          <MDButton
            data-testid="button-text-hover"
            class="md-state_hover"
            label="Text hover"
            color="text"
            style="
              --md-comp-button-text-label-text-color: rgb(30 30 30);
              --md-comp-button-text-hovered-label-text-color: rgb(0 128 0);
              --md-comp-button-text-icon-color: rgb(90 20 150);
              --md-comp-button-text-hovered-icon-color: rgb(255 0 0);
              --md-comp-button-text-hovered-state-layer-color: rgb(255 0 0);
              --md-comp-button-text-hovered-state-layer-opacity: 0.03;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-text-focus"
            class="md-state_focused"
            label="Text focus"
            color="text"
            style="
              --md-comp-button-text-focused-label-text-color: rgb(0 0 255);
              --md-comp-button-text-focused-icon-color: rgb(255 165 0);
              --md-comp-button-text-focused-state-layer-color: rgb(0 128 0);
              --md-comp-button-text-focused-state-layer-opacity: 0.17;
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-text-pressed"
            class="md-state_pressed"
            label="Text pressed"
            color="text"
            style="
              --md-comp-button-text-pressed-label-text-color: rgb(255 0 255);
              --md-comp-button-text-pressed-icon-color: rgb(0 255 255);
              --md-comp-button-text-pressed-state-layer-color: rgb(0 0 255);
              --md-comp-button-text-pressed-state-layer-opacity: 0.29;
            "
          >
            <template #icon>+</template>
          </MDButton>
        </div>
        <div class="visual-row">
          <MDButton
            data-testid="button-selected-hover"
            class="md-state_hover"
            label="Selected"
            variant="toggle"
            color="filled"
            selected
            style="
              --md-comp-button-filled-hovered-state-layer-opacity: 0.11;
              --md-comp-button-filled-selected-container-color: rgb(120 20 20);
              --md-comp-button-filled-selected-hovered-state-layer-color: rgb(180 0 0);
              --md-comp-button-filled-selected-label-text-color: rgb(20 20 20);
              --md-comp-button-filled-selected-hovered-label-text-color: rgb(180 0 180);
              --md-comp-button-filled-selected-icon-color: rgb(40 40 40);
              --md-comp-button-filled-selected-hovered-icon-color: rgb(0 120 120);
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-unselected-hover"
            class="md-state_hover"
            label="Unselected"
            variant="toggle"
            color="filled"
            style="
              --md-comp-button-filled-hovered-state-layer-opacity: 0.11;
              --md-comp-button-filled-unselected-container-color: rgb(20 20 120);
              --md-comp-button-filled-unselected-hovered-state-layer-color: rgb(0 0 180);
              --md-comp-button-filled-unselected-label-text-color: rgb(50 50 50);
              --md-comp-button-filled-unselected-hovered-label-text-color: rgb(0 90 0);
              --md-comp-button-filled-unselected-icon-color: rgb(70 70 70);
              --md-comp-button-filled-unselected-hovered-icon-color: rgb(160 80 0);
            "
          >
            <template #icon>+</template>
          </MDButton>
        </div>
      </div>
    `,
  }),
};

export const LoadingColorRouting: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-loading-color-routing" class="visual-surface">
        <div class="visual-row">
          <MDButton
            data-testid="button-resting-color"
            label="Loading"
            color="filled"
            style="
              --md-comp-button-filled-label-text-color: rgb(12 34 56);
              --md-comp-button-filled-icon-color: rgb(90 12 180);
            "
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            data-testid="button-loading-color"
            label="Loading"
            color="filled"
            loading
            style="
              --md-comp-button-filled-label-text-color: rgb(12 34 56);
              --md-comp-button-filled-icon-color: rgb(90 12 180);
            "
          >
            <template #icon>+</template>
          </MDButton>
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
