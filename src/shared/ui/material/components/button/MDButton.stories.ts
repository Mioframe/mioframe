import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDButton from './MDButton.vue';
import MDButtonTargetHitVisualStory from './MDButtonTargetHitVisualStory.vue';
import { MDStateLayerForcedStateProvider } from '../../foundation/state/testing';
import { useFocusIndicator } from '../../foundation/state/useFocusIndicator';

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
          "**Toggle shape**: selected toggle buttons morph container shape per size (round input shape morphs to the size's square corner token, square input shape morphs to a fully-rounded corner token); the pressed shape always takes precedence over the selected shape, and the selected shape is preserved while disabled (pressed cannot activate while disabled, so it never overrides selected there).",
          '',
          '**Unsupported: text toggle**: the verified Material Button specs state that toggle buttons do not use the text style, and the color matrix publishes no text selected/unselected routes. `color="text"` combined with `variant="toggle"` normalizes the applied variant to `"default"`: no `aria-pressed`, `selected` ignored, no selected shape or classes, and a development warning is logged. Ordinary `color="text"` `variant="default"` is unaffected.',
          '',
          '**Text spacing**: text buttons use the same per-size `leading-space`/`trailing-space` tokens as every other color style (no fixed small-size padding override).',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDButton>;

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

export const Toggle: Story = {
  args: {
    variant: 'toggle',
    selected: true,
    color: 'tonal',
    label: 'Bookmark',
  },
  decorators: [withCheckerboard],
};

export const ToggleText: Story = {
  args: {
    variant: 'toggle',
    selected: true,
    color: 'text',
    label: 'Bookmark',
  },
  decorators: [withCheckerboard],
};

export const ToggleShapes: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-button-toggle-shapes" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton data-testid="toggle-round-selected" label="Round selected" variant="toggle" shape="round" selected color="tonal" />
          <MDButton data-testid="toggle-round-unselected" label="Round unselected" variant="toggle" shape="round" color="tonal" />
          <MDStateLayerForcedStateProvider pressed>
            <MDButton data-testid="toggle-round-pressed" class="md-state_pressed" label="Round pressed" shape="round" color="tonal" />
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDButton data-testid="toggle-round-selected-pressed" class="md-state_pressed" label="Round selected pressed" variant="toggle" shape="round" selected color="tonal" />
          </MDStateLayerForcedStateProvider>
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
    components: { MDButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-button-toggle-interaction-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Unselected" variant="toggle" color="tonal">
            <template #icon>+</template>
          </MDButton>
          <MDButton label="Selected" variant="toggle" selected color="tonal">
            <template #icon>+</template>
          </MDButton>
          <MDStateLayerForcedStateProvider hovered>
            <MDButton class="md-state_hover" label="Selected hover" variant="toggle" selected color="tonal">
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider focused>
            <MDButton class="md-state_focused" label="Selected focus" variant="toggle" selected color="tonal">
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDButton class="md-state_pressed" label="Selected pressed" variant="toggle" selected color="tonal">
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDButton label="Disabled selected" variant="toggle" selected disabled color="tonal">
            <template #icon>+</template>
          </MDButton>
        </div>
      </div>
    `,
  }),
};

export const DisabledSelectedOutlinedAndText: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-disabled-selected-outlined-text" class="visual-checker-backdrop visual-gallery-grid" style="--visual-gallery-columns: 2">
        <div class="visual-row"><span class="visual-gallery-label">Outlined unselected disabled</span><span class="visual-gallery-label">Outlined selected disabled</span></div>
        <div class="visual-row">
          <MDButton data-testid="outlined-unselected-disabled" label="Unselected" variant="toggle" disabled color="outlined" />
          <MDButton data-testid="outlined-selected-disabled" label="Selected" variant="toggle" selected disabled color="outlined" />
        </div>
        <div class="visual-row"><span class="visual-gallery-label">Text disabled</span><span aria-hidden="true"></span></div>
        <div class="visual-row">
          <MDButton data-testid="text-disabled" label="Disabled text" color="text" disabled />
          <span aria-hidden="true"></span>
        </div>
      </div>
    `,
  }),
};

export const FocusIndicatorTarget: Story = {
  decorators: [withCheckerboard],
  render: () => ({
    components: { MDButton },
    setup() {
      useFocusIndicator();
    },
    template: `
      <div class="visual-checker-backdrop" style="position:fixed;inset:0;">
        <div id="visual-md-button-focus-indicator" style="position:absolute;inset:auto 12px 12px auto;">
        <MDButton id="storybook-md-button-focus" label="Focus target" color="filled" />
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
      <div data-testid="visual-md-button-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Filled" color="filled"><template #icon>+</template></MDButton>
          <MDButton label="Outlined" color="outlined"><template #icon>+</template></MDButton>
          <MDButton label="Text" color="text"><template #icon>+</template></MDButton>
        </div>
        <div class="visual-row">
          <MDButton label="Tonal" color="tonal"><template #icon>+</template></MDButton>
          <MDButton label="Elevated" color="elevated"><template #icon>+</template></MDButton>
          <MDButton label="Disabled elevated" color="elevated" disabled><template #icon>+</template></MDButton>
        </div>
        <div class="visual-row">
          <MDButton label="Disabled filled" color="filled" disabled><template #icon>+</template></MDButton>
          <MDButton label="Disabled tonal" color="tonal" disabled><template #icon>+</template></MDButton>
          <MDButton label="Disabled outlined" color="outlined" disabled><template #icon>+</template></MDButton>
          <MDButton label="Disabled text" color="text" disabled><template #icon>+</template></MDButton>
        </div>
      </div>
    `,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-button-interaction-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDButton class="md-state_hover" label="Elevated hover" color="elevated" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDButton class="md-state_focused" label="Elevated focus" color="elevated" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDButton class="md-state_pressed" label="Elevated pressed" color="elevated" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDButton class="md-state_hover" label="Filled hover" color="filled" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDButton class="md-state_focused" label="Filled focus" color="filled" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDButton class="md-state_pressed" label="Filled pressed" color="filled" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDButton class="md-state_hover" label="Tonal hover" color="tonal" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDButton class="md-state_focused" label="Tonal focus" color="tonal" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDButton class="md-state_pressed" label="Tonal pressed" color="tonal" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDButton class="md-state_hover" label="Outlined hover" color="outlined" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDButton class="md-state_focused" label="Outlined focus" color="outlined" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDButton class="md-state_pressed" label="Outlined pressed" color="outlined" /></MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered><MDButton class="md-state_hover" label="Text hover" color="text" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused><MDButton class="md-state_focused" label="Text focus" color="text" /></MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed><MDButton class="md-state_pressed" label="Text pressed" color="text" /></MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

const DEFAULT_ROLE_BUTTON_STYLES = ['elevated', 'filled', 'tonal', 'outlined', 'text'] as const;
const DEFAULT_ROLE_STATES = ['hover', 'focus', 'pressed'] as const;

export const DefaultRoleMatrix: Story = {
  render: () => ({
    components: { MDButton, MDStateLayerForcedStateProvider },
    setup() {
      return { DEFAULT_ROLE_BUTTON_STYLES, DEFAULT_ROLE_STATES };
    },
    template: `
      <div data-testid="visual-md-button-default-role-matrix" class="visual-checker-backdrop">
        <div v-for="style in DEFAULT_ROLE_BUTTON_STYLES" :key="style" class="visual-row">
          <MDStateLayerForcedStateProvider
            v-for="state in DEFAULT_ROLE_STATES"
            :key="state"
            :hovered="state === 'hover'"
            :focused="state === 'focus'"
            :pressed="state === 'pressed'"
          >
            <MDButton
              :class="'md-state_' + (state === 'focus' ? 'focused' : state)"
              :label="style + ' ' + state"
              :color="style"
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
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
      <div data-testid="visual-md-button-size-typography" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton data-testid="typography-extra-small" label="Extra small" size="extra-small" />
          <MDButton data-testid="typography-small" label="Small" size="small" />
          <MDButton data-testid="typography-medium" label="Medium" size="medium" />
          <MDButton data-testid="typography-large" label="Large" size="large" />
          <MDButton data-testid="typography-extra-large" label="Extra large" size="extra-large" />
        </div>
      </div>
    `,
  }),
};

/** Every documented `MDButton` size, in ascending order, for table-driven geometry coverage. */
const BUTTON_SIZES = ['extra-small', 'small', 'medium', 'large', 'extra-large'] as const;

export const SizeGeometryMatrix: Story = {
  render: () => ({
    components: { MDButton, MDStateLayerForcedStateProvider },
    setup() {
      return { BUTTON_SIZES };
    },
    template: `
      <div data-testid="visual-md-button-size-geometry" class="visual-checker-backdrop visual-gallery-grid" style="--visual-gallery-columns: 6">
        <div class="visual-row"><span class="visual-gallery-heading">Size</span><span class="visual-gallery-label">Round</span><span class="visual-gallery-label">Square</span><span class="visual-gallery-label">Pressed</span><span class="visual-gallery-label">Selected round</span><span class="visual-gallery-label">Selected square</span><span class="visual-gallery-label">Outlined</span></div>
        <div v-for="size in BUTTON_SIZES" :key="size" class="visual-row">
          <span class="visual-gallery-label">{{ size }}</span>
          <MDButton :data-testid="\`geometry-\${size}-round\`" :label="size" :size="size" shape="round">
            <template #icon>+</template>
          </MDButton>
          <MDButton :data-testid="\`geometry-\${size}-square\`" :label="size" :size="size" shape="square">
            <template #icon>+</template>
          </MDButton>
          <MDStateLayerForcedStateProvider pressed>
            <MDButton
              :data-testid="\`geometry-\${size}-pressed\`"
              class="md-state_pressed"
              :label="size"
              :size="size"
              shape="round"
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDButton
            :data-testid="\`geometry-\${size}-selected-round\`"
            :label="size"
            :size="size"
            shape="round"
            variant="toggle"
            selected
            color="tonal"
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            :data-testid="\`geometry-\${size}-selected-square\`"
            :label="size"
            :size="size"
            shape="square"
            variant="toggle"
            selected
            color="tonal"
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton :data-testid="\`geometry-\${size}-outlined\`" :label="size" :size="size" color="outlined" />
        </div>
      </div>
    `,
  }),
};

export const DisabledStatePrecedence: Story = {
  render: () => ({
    components: { MDButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-button-disabled-state-precedence" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton data-testid="disabled-resting" label="Disabled outlined" color="outlined" disabled>
            <template #icon>+</template>
          </MDButton>
          <MDStateLayerForcedStateProvider hovered>
            <MDButton data-testid="disabled-hover" class="md-state_hover" label="Disabled outlined hover" color="outlined" disabled>
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDButton data-testid="disabled-focus" class="md-state_focused" label="Disabled outlined focus" color="outlined" disabled>
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDButton data-testid="disabled-pressed" class="md-state_pressed" label="Disabled outlined pressed" color="outlined" disabled>
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

export const TextButtonSpacing: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-text-spacing" class="visual-checker-backdrop">
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
    components: { MDButton, MDStateLayerForcedStateProvider },
    template: `
      <div data-testid="visual-md-button-token-routing" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
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
                --md-comp-button-filled-hovered-state-layer-color: rgb(255 0 200);
                --md-comp-button-filled-hovered-state-layer-opacity: 0.03;
              "
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
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
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
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
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
            <MDButton
              data-testid="button-outlined-hover"
              class="md-state_hover"
              label="Outlined hover"
              color="outlined"
              style="
                --md-comp-button-outlined-hovered-label-text-color: rgb(0 128 0);
                --md-comp-button-outlined-hovered-icon-color: rgb(255 0 0);
                --md-comp-button-outlined-hovered-outline-color: rgb(120 10 10);
                --md-comp-button-outlined-hovered-state-layer-color: rgb(255 0 200);
                --md-comp-button-outlined-hovered-state-layer-opacity: 0.03;
              "
            ><template #icon>+</template></MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
            <MDButton
              data-testid="button-outlined-focus"
              class="md-state_focused"
              label="Outlined focus"
              color="outlined"
              style="
                --md-comp-button-outlined-focused-label-text-color: rgb(0 0 255);
                --md-comp-button-outlined-focused-icon-color: rgb(255 165 0);
                --md-comp-button-outlined-focused-outline-color: rgb(10 120 10);
                --md-comp-button-outlined-focused-state-layer-color: rgb(0 128 0);
                --md-comp-button-outlined-focused-state-layer-opacity: 0.17;
              "
            ><template #icon>+</template></MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
            <MDButton
              data-testid="button-outlined-pressed"
              class="md-state_pressed"
              label="Outlined pressed"
              color="outlined"
              style="
                --md-comp-button-outlined-pressed-label-text-color: rgb(255 0 255);
                --md-comp-button-outlined-pressed-icon-color: rgb(0 255 255);
                --md-comp-button-outlined-pressed-outline-color: rgb(10 10 120);
                --md-comp-button-outlined-pressed-state-layer-color: rgb(0 0 255);
                --md-comp-button-outlined-pressed-state-layer-opacity: 0.29;
              "
            ><template #icon>+</template></MDButton>
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
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
                --md-comp-button-tonal-hovered-state-layer-color: rgb(255 0 200);
                --md-comp-button-tonal-hovered-state-layer-opacity: 0.03;
              "
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
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
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
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
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
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
                --md-comp-button-elevated-hovered-state-layer-color: rgb(255 0 200);
                --md-comp-button-elevated-hovered-state-layer-opacity: 0.03;
              "
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
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
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
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
          </MDStateLayerForcedStateProvider>
        </div>
        <div class="visual-row">
          <MDStateLayerForcedStateProvider hovered>
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
                --md-comp-button-text-hovered-state-layer-color: rgb(255 0 200);
                --md-comp-button-text-hovered-state-layer-opacity: 0.03;
              "
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider focused>
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
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider pressed>
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
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

/** The four Button styles publishing distinct selected/unselected Material color tokens. */
const BUTTON_TOGGLE_STYLES = ['elevated', 'filled', 'tonal', 'outlined'] as const;
type ButtonToggleStyle = (typeof BUTTON_TOGGLE_STYLES)[number];
const BUTTON_TOGGLE_INTERACTION_STATES = ['hover', 'focus', 'pressed'] as const;
type ButtonToggleInteractionState = (typeof BUTTON_TOGGLE_INTERACTION_STATES)[number];

export const DefaultToggleRoleMatrix: Story = {
  render: () => ({
    components: { MDButton, MDStateLayerForcedStateProvider },
    setup() {
      return { BUTTON_TOGGLE_STYLES, BUTTON_TOGGLE_INTERACTION_STATES };
    },
    template: `
      <div data-testid="visual-md-button-default-toggle-role-matrix" class="visual-checker-backdrop">
        <div v-for="style in BUTTON_TOGGLE_STYLES" :key="style" class="visual-row">
          <template v-for="selected in [false, true]" :key="String(selected)">
            <MDButton :data-testid="'default-button-toggle-' + style + '-' + (selected ? 'selected' : 'unselected') + '-resting'" :label="style + ' ' + (selected ? 'selected' : 'unselected') + ' resting'" variant="toggle" :selected="selected" :color="style"><template #icon>+</template></MDButton>
            <MDStateLayerForcedStateProvider
              v-for="state in BUTTON_TOGGLE_INTERACTION_STATES"
              :key="state"
              :hovered="state === 'hover'"
              :focused="state === 'focus'"
              :pressed="state === 'pressed'"
            >
              <MDButton :data-testid="'default-button-toggle-' + style + '-' + (selected ? 'selected' : 'unselected') + '-' + state" :class="'md-state_' + (state === 'focus' ? 'focused' : state)" :label="style + ' ' + (selected ? 'selected' : 'unselected') + ' ' + state" variant="toggle" :selected="selected" :color="style"><template #icon>+</template></MDButton>
            </MDStateLayerForcedStateProvider>
          </template>
        </div>
      </div>
    `,
  }),
};

const BUTTON_TOGGLE_ADDITIONAL_STATES: Record<
  ButtonToggleStyle,
  Record<
    'selected' | 'unselected',
    Record<'focus' | 'pressed', { label: string; icon: string; stateLayerColor: string }>
  > & { focusOpacity: string; pressedOpacity: string }
> = {
  elevated: {
    selected: {
      focus: {
        label: 'rgb(201 254 199)',
        icon: 'rgb(254 209 2)',
        stateLayerColor: 'rgb(2 198 161)',
      },
      pressed: {
        label: 'rgb(202 253 198)',
        icon: 'rgb(253 208 4)',
        stateLayerColor: 'rgb(4 196 162)',
      },
    },
    unselected: {
      focus: {
        label: 'rgb(189 211 254)',
        icon: 'rgb(254 121 179)',
        stateLayerColor: 'rgb(149 82 1)',
      },
      pressed: {
        label: 'rgb(188 212 253)',
        icon: 'rgb(253 122 178)',
        stateLayerColor: 'rgb(148 84 2)',
      },
    },
    focusOpacity: '0.19',
    pressedOpacity: '0.29',
  },
  filled: {
    selected: {
      focus: { label: 'rgb(21 22 23)', icon: 'rgb(41 42 43)', stateLayerColor: 'rgb(179 2 3)' },
      pressed: { label: 'rgb(24 25 26)', icon: 'rgb(44 45 46)', stateLayerColor: 'rgb(178 4 6)' },
    },
    unselected: {
      focus: { label: 'rgb(51 52 53)', icon: 'rgb(71 72 73)', stateLayerColor: 'rgb(2 3 179)' },
      pressed: { label: 'rgb(54 55 56)', icon: 'rgb(74 75 76)', stateLayerColor: 'rgb(4 6 178)' },
    },
    focusOpacity: '0.21',
    pressedOpacity: '0.31',
  },
  tonal: {
    selected: {
      focus: {
        label: 'rgb(254 239 198)',
        icon: 'rgb(254 253 2)',
        stateLayerColor: 'rgb(199 102 3)',
      },
      pressed: {
        label: 'rgb(253 238 196)',
        icon: 'rgb(253 251 4)',
        stateLayerColor: 'rgb(198 104 6)',
      },
    },
    unselected: {
      focus: {
        label: 'rgb(198 254 239)',
        icon: 'rgb(2 253 254)',
        stateLayerColor: 'rgb(3 119 199)',
      },
      pressed: {
        label: 'rgb(196 253 238)',
        icon: 'rgb(4 251 253)',
        stateLayerColor: 'rgb(6 118 198)',
      },
    },
    focusOpacity: '0.23',
    pressedOpacity: '0.33',
  },
  outlined: {
    selected: {
      focus: {
        label: 'rgb(239 198 254)',
        icon: 'rgb(254 2 149)',
        stateLayerColor: 'rgb(149 3 254)',
      },
      pressed: {
        label: 'rgb(238 196 253)',
        icon: 'rgb(253 4 148)',
        stateLayerColor: 'rgb(148 6 253)',
      },
    },
    unselected: {
      focus: {
        label: 'rgb(209 208 207)',
        icon: 'rgb(2 253 119)',
        stateLayerColor: 'rgb(3 89 254)',
      },
      pressed: {
        label: 'rgb(206 205 204)',
        icon: 'rgb(4 251 118)',
        stateLayerColor: 'rgb(6 88 253)',
      },
    },
    focusOpacity: '0.25',
    pressedOpacity: '0.35',
  },
};

interface ButtonToggleBranchTokens {
  /** Resting container color. Omitted where the style publishes none (outlined unselected). */
  container?: string;
  /** Resting label color. */
  restingLabel: string;
  /** Resting icon color. */
  restingIcon: string;
  /** Hover-forced label color. */
  label: string;
  /** Hover-forced icon color. */
  icon: string;
  /** Hover-forced state-layer color. */
  stateLayerColor: string;
  /** Resting outline color. Only `outlined` publishes a per-branch outline token. */
  outline?: string;
}

/**
 * Deterministic, hand-written override values proving that selected and unselected container,
 * label, icon, and (hover-forced) state-layer color route independently per Button style, plus
 * outline for `outlined` (its only style with a selected/unselected outline token; the outline
 * itself does not have a distinct hovered variant in `MDButton.vue`, so it is read at rest, not
 * under the forced-hover provider). Every literal is unique within its own branch so a routing bug
 * that swapped two properties would be caught. Test-local fixture data, not a production token
 * table.
 */
const BUTTON_TOGGLE_MATRIX: Record<
  ButtonToggleStyle,
  { selected: ButtonToggleBranchTokens; unselected: ButtonToggleBranchTokens; hoverOpacity: string }
> = {
  elevated: {
    selected: {
      container: 'rgb(10 60 10)',
      restingLabel: 'rgb(11 61 12)',
      restingIcon: 'rgb(13 62 14)',
      label: 'rgb(200 255 200)',
      icon: 'rgb(255 210 0)',
      stateLayerColor: 'rgb(0 200 160)',
    },
    unselected: {
      container: 'rgb(10 10 90)',
      restingLabel: 'rgb(11 12 91)',
      restingIcon: 'rgb(13 14 92)',
      label: 'rgb(190 210 255)',
      icon: 'rgb(255 120 180)',
      stateLayerColor: 'rgb(150 80 0)',
    },
    hoverOpacity: '0.09',
  },
  filled: {
    selected: {
      container: 'rgb(120 20 20)',
      restingLabel: 'rgb(121 21 22)',
      restingIcon: 'rgb(122 23 24)',
      label: 'rgb(20 20 20)',
      icon: 'rgb(40 40 40)',
      stateLayerColor: 'rgb(180 0 0)',
    },
    unselected: {
      container: 'rgb(20 20 120)',
      restingLabel: 'rgb(21 22 121)',
      restingIcon: 'rgb(23 24 122)',
      label: 'rgb(50 50 50)',
      icon: 'rgb(70 70 70)',
      stateLayerColor: 'rgb(0 0 180)',
    },
    hoverOpacity: '0.11',
  },
  tonal: {
    selected: {
      container: 'rgb(90 60 10)',
      restingLabel: 'rgb(91 61 12)',
      restingIcon: 'rgb(92 63 14)',
      label: 'rgb(255 240 200)',
      icon: 'rgb(255 255 0)',
      stateLayerColor: 'rgb(200 100 0)',
    },
    unselected: {
      container: 'rgb(10 90 60)',
      restingLabel: 'rgb(11 91 62)',
      restingIcon: 'rgb(13 92 64)',
      label: 'rgb(200 255 240)',
      icon: 'rgb(0 255 255)',
      stateLayerColor: 'rgb(0 120 200)',
    },
    hoverOpacity: '0.13',
  },
  outlined: {
    selected: {
      container: 'rgb(60 10 90)',
      restingLabel: 'rgb(61 12 91)',
      restingIcon: 'rgb(63 14 92)',
      label: 'rgb(240 200 255)',
      icon: 'rgb(255 0 150)',
      stateLayerColor: 'rgb(150 0 255)',
      outline: 'rgb(200 0 120)',
    },
    unselected: {
      restingLabel: 'rgb(211 212 213)',
      restingIcon: 'rgb(2 251 121)',
      label: 'rgb(210 210 210)',
      icon: 'rgb(0 255 120)',
      stateLayerColor: 'rgb(0 90 255)',
      outline: 'rgb(90 60 0)',
    },
    hoverOpacity: '0.15',
  },
};

const buttonToggleRestingStyle = (style: ButtonToggleStyle, branch: 'selected' | 'unselected') => {
  const tokens = BUTTON_TOGGLE_MATRIX[style][branch];
  const restingStyle: Record<string, string> = {};
  if (tokens.container !== undefined) {
    restingStyle[`--md-comp-button-${style}-${branch}-container-color`] = tokens.container;
  }
  restingStyle[`--md-comp-button-${style}-${branch}-label-text-color`] = tokens.restingLabel;
  restingStyle[`--md-comp-button-${style}-${branch}-icon-color`] = tokens.restingIcon;
  if (tokens.outline !== undefined) {
    restingStyle[`--md-comp-button-${style}-${branch}-outline-color`] = tokens.outline;
  }
  return restingStyle;
};

const buttonToggleInteractionStyle = (
  style: ButtonToggleStyle,
  branch: 'selected' | 'unselected',
  state: ButtonToggleInteractionState,
) => {
  const entry = BUTTON_TOGGLE_MATRIX[style];
  const tokens =
    state === 'hover' ? entry[branch] : BUTTON_TOGGLE_ADDITIONAL_STATES[style][branch][state];
  const opacity =
    state === 'hover'
      ? entry.hoverOpacity
      : BUTTON_TOGGLE_ADDITIONAL_STATES[style][`${state}Opacity`];
  const tokenState = state === 'hover' ? 'hovered' : state === 'focus' ? 'focused' : 'pressed';
  return {
    [`--md-comp-button-${style}-${tokenState}-state-layer-opacity`]: opacity,
    [`--md-comp-button-${style}-${branch}-${tokenState}-label-text-color`]: tokens.label,
    [`--md-comp-button-${style}-${branch}-${tokenState}-icon-color`]: tokens.icon,
    [`--md-comp-button-${style}-${branch}-${tokenState}-state-layer-color`]: tokens.stateLayerColor,
  };
};

export const ToggleTokenRoutingMatrix: Story = {
  render: () => ({
    components: { MDButton, MDStateLayerForcedStateProvider },
    setup() {
      return {
        BUTTON_TOGGLE_STYLES,
        BUTTON_TOGGLE_INTERACTION_STATES,
        buttonToggleRestingStyle,
        buttonToggleInteractionStyle,
      };
    },
    template: `
      <div data-testid="visual-md-button-toggle-token-routing" class="visual-checker-backdrop">
        <div v-for="style in BUTTON_TOGGLE_STYLES" :key="style" class="visual-row">
          <MDButton
            :data-testid="\`toggle-token-\${style}-selected-resting\`"
            :label="\`\${style} selected\`"
            variant="toggle"
            selected
            :color="style"
            :style="buttonToggleRestingStyle(style, 'selected')"
          >
            <template #icon>+</template>
          </MDButton>
          <MDButton
            :data-testid="\`toggle-token-\${style}-unselected-resting\`"
            :label="\`\${style} unselected\`"
            variant="toggle"
            :color="style"
            :style="buttonToggleRestingStyle(style, 'unselected')"
          >
            <template #icon>+</template>
          </MDButton>
          <MDStateLayerForcedStateProvider
            v-for="state in BUTTON_TOGGLE_INTERACTION_STATES"
            :key="'selected-' + state"
            :hovered="state === 'hover'"
            :focused="state === 'focus'"
            :pressed="state === 'pressed'"
          >
            <MDButton
              :data-testid="\`toggle-token-\${style}-selected-\${state}\`"
              :class="'md-state_' + (state === 'focus' ? 'focused' : state)"
              :label="\`\${style} selected \${state}\`"
              variant="toggle"
              selected
              :color="style"
              :style="buttonToggleInteractionStyle(style, 'selected', state)"
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
          <MDStateLayerForcedStateProvider
            v-for="state in BUTTON_TOGGLE_INTERACTION_STATES"
            :key="'unselected-' + state"
            :hovered="state === 'hover'"
            :focused="state === 'focus'"
            :pressed="state === 'pressed'"
          >
            <MDButton
              :data-testid="\`toggle-token-\${style}-unselected-\${state}\`"
              :class="'md-state_' + (state === 'focus' ? 'focused' : state)"
              :label="\`\${style} unselected \${state}\`"
              variant="toggle"
              :color="style"
              :style="buttonToggleInteractionStyle(style, 'unselected', state)"
            >
              <template #icon>+</template>
            </MDButton>
          </MDStateLayerForcedStateProvider>
        </div>
      </div>
    `,
  }),
};

export const LoadingColorRouting: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-loading-color-routing" class="visual-checker-backdrop">
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
      <div data-testid="visual-md-button-targets" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="XS target" size="extra-small" />
          <MDButton label="S target" size="small" />
        </div>
      </div>
    `,
  }),
};

/**
 * Official Buttons guidelines: label text must never truncate or wrap on Web — it should always
 * be fully visible on a single line. The Android-specific "fit within two lines after 200% text
 * scaling" accessibility statement does not apply here (see README Source Decision 2). Each
 * fixture's `max-width` is intentionally narrower than the label's unwrapped width, so the
 * container's own boundary provides no clipping — the button is expected to render wider than
 * its containing block rather than wrap or truncate the label.
 */
export const LabelNoWrap: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-label-no-wrap" class="visual-checker-backdrop">
        <div class="visual-row">
          <div style="max-width: 160px;">
            <MDButton
              data-testid="no-wrap-small"
              label="This label is intentionally long enough to overflow a narrow container"
              size="small"
            />
          </div>
          <div style="max-width: 220px;">
            <MDButton
              data-testid="no-wrap-medium"
              label="This label is intentionally long enough to overflow a narrow container"
              size="medium"
            >
              <template #icon>+</template>
            </MDButton>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * The leading icon is not an independent trailing-icon feature — anatomy names one optional
 * leading icon only. `MDButton.vue` renders icon-then-label with no directional CSS (default
 * `flex-direction: row`, which is writing-mode/direction relative), so under `dir="rtl"` the
 * icon should mirror to the visual right of the label without any RTL-specific code.
 */
export const RtlIconMirroring: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-rtl-icon-mirroring" class="visual-checker-backdrop">
        <div class="visual-row">
          <div dir="ltr">
            <MDButton data-testid="rtl-icon-ltr" label="Save">
              <template #icon>+</template>
            </MDButton>
          </div>
          <div dir="rtl">
            <MDButton data-testid="rtl-icon-rtl" label="Save">
              <template #icon>+</template>
            </MDButton>
          </div>
        </div>
      </div>
    `,
  }),
};
