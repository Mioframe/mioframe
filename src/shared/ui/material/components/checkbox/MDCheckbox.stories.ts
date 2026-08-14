import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useArgs } from 'storybook/preview-api';
import { ref } from 'vue';
import MDCheckbox from './MDCheckbox.vue';

const meta = {
  title: 'Material 3/Components/Checkbox/MDCheckbox',
  component: MDCheckbox,
  tags: ['autodocs'],
  args: { 'aria-label': 'Select item', checked: false },
  argTypes: {
    'onUpdate:checked': { action: 'update:checked' },
    'onUpdate:indeterminate': { action: 'update:indeterminate' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mioframe Material Checkbox adapter backed privately by @m3e/web. Demand-scoped to the official tri-state selection axis (controlled `checked`/`indeterminate`, `disabled`) plus the Mioframe `presentation` composition extension used by decorative list-item/row toggles and read-only value displays.',
      },
    },
  },
} satisfies Meta<typeof MDCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// The Playground surface: Controls drive `checked`/`indeterminate` through Storybook's args, and
// a native toggle round-trips back into args via `useArgs` so Controls and direct interaction
// stay synchronized either way (docs/testing/storybook.md "Args and Controls"). `useArgs` is a
// Storybook preview hook, so it must run in the story's `render` function, not inside the
// returned Vue component's `setup()`.
export const Default: Story = {
  render: function Render() {
    const [args, updateArgs] = useArgs<{
      /** Official binary selection state. */
      checked?: boolean | undefined;
      /** Official tri-state indeterminate axis. */
      indeterminate?: boolean | undefined;
    }>();
    const onUpdateChecked = (checked: boolean) => {
      updateArgs({ checked });
    };
    const onUpdateIndeterminate = (indeterminate: boolean) => {
      updateArgs({ indeterminate });
    };

    return {
      components: { MDCheckbox },
      setup() {
        return { args, onUpdateChecked, onUpdateIndeterminate };
      },
      template:
        '<MDCheckbox v-bind="args" @update:checked="onUpdateChecked" @update:indeterminate="onUpdateIndeterminate" />',
    };
  },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Presentation: Story = {
  render: () => ({
    components: { MDCheckbox },
    template: `
      <div
        data-testid="md-checkbox-presentation"
        role="checkbox"
        aria-checked="true"
        aria-label="Select item"
        tabindex="0"
        style="display: inline-flex; align-items: center; gap: 8px;"
      >
        Select item
        <MDCheckbox presentation checked />
      </div>
    `,
  }),
};

// Controlled-state rejected-intent fixture (ARCHITECTURE.md "Acceptance criteria"): the checkbox
// stays at `checked: false` and the fixture's own handler only records the emitted intent
// instead of writing it back, so a real activation must leave the rendered `checked` unchanged.
export const RejectedIntent: Story = {
  render: () => ({
    components: { MDCheckbox },
    setup() {
      const intentCount = ref(0);
      const lastChecked = ref<boolean | undefined>(undefined);
      const onUpdateChecked = (value: boolean) => {
        intentCount.value += 1;
        lastChecked.value = value;
      };
      return { intentCount, lastChecked, onUpdateChecked };
    },
    template: `
      <div data-testid="md-checkbox-rejected-intent">
        <MDCheckbox aria-label="Rejected intent" :checked="false" @update:checked="onUpdateChecked" />
        <output id="md-checkbox-rejected-intent-count">{{ intentCount }}</output>
        <output id="md-checkbox-rejected-intent-value">{{ lastChecked }}</output>
      </div>
    `,
  }),
};

// `presentation` composition pass-through fixture (ARCHITECTURE.md "Implementation passes" #6):
// the fixture itself, not MDCheckbox, owns the action handler and local `checked`/`indeterminate`
// state, matching the confirmed decorative list-item/row composition scenario. Pointer input on
// the visible decorative region must reach this owner's own action (the wrapping element, since
// `presentation`'s `pointer-events: none` makes the renderer host itself unreachable by pointer),
// and the owner's resulting state must flow back into `checked`/rendered `checked`.
export const PresentationComposition: Story = {
  render: () => ({
    components: { MDCheckbox },
    setup() {
      const checked = ref(false);
      const disabled = ref(false);
      const toggleCount = ref(0);
      const onAction = () => {
        checked.value = !checked.value;
        toggleCount.value += 1;
      };
      return { checked, disabled, onAction, toggleCount };
    },
    template: `
      <div
        data-testid="md-checkbox-presentation-composition"
        role="checkbox"
        :aria-checked="checked ? 'true' : 'false'"
        :aria-disabled="disabled ? 'true' : 'false'"
        aria-label="Select item"
        tabindex="0"
        style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer;"
        @click="onAction"
      >
        Select item
        <MDCheckbox presentation :checked="checked" :disabled="disabled" />
        <output id="md-checkbox-presentation-composition-count">{{ toggleCount }}</output>
      </div>
    `,
  }),
};

export const BehaviorContracts: Story = {
  render: () => ({
    components: { MDCheckbox },
    setup() {
      const labelledChecked = ref(false);
      const standaloneChecked = ref(false);
      const changeCount = ref(0);
      const disabledChecked = ref(false);
      const onUpdateLabelled = (value: boolean) => {
        labelledChecked.value = value;
        changeCount.value += 1;
      };
      const onUpdateStandalone = (value: boolean) => {
        standaloneChecked.value = value;
      };
      return {
        changeCount,
        disabledChecked,
        labelledChecked,
        onUpdateLabelled,
        onUpdateStandalone,
        standaloneChecked,
      };
    },
    template: `
      <div data-testid="md-checkbox-behavior-contracts">
        <span id="behavior-labelledby-text">Labelledby checkbox</span>
        <MDCheckbox id="behavior-labelled-checkbox" aria-labelledby="behavior-labelledby-text" :checked="labelledChecked" @update:checked="onUpdateLabelled" />
        <output id="md-checkbox-change-count">{{ changeCount }}</output>
        <MDCheckbox aria-label="Standalone labelled checkbox" :checked="standaloneChecked" @update:checked="onUpdateStandalone" />
        <MDCheckbox aria-label="Disabled checkbox" disabled :checked="disabledChecked" />
      </div>
    `,
  }),
};

// Adjacent-label click-to-toggle fixture, matching `MDCheckboxField`'s external `<label for>`
// pattern (ARCHITECTURE.md "Implementation passes" #5).
export const AdjacentLabel: Story = {
  render: () => ({
    components: { MDCheckbox },
    setup() {
      const checked = ref(false);
      const onUpdateChecked = (value: boolean) => {
        checked.value = value;
      };
      return { checked, onUpdateChecked };
    },
    template: `
      <div data-testid="md-checkbox-adjacent-label" style="display: inline-flex; align-items: center; gap: 8px;">
        <MDCheckbox id="adjacent-label-checkbox" :checked="checked" @update:checked="onUpdateChecked" />
        <label for="adjacent-label-checkbox">Adjacent label</label>
      </div>
    `,
  }),
};

export const TabOrderFixture: Story = {
  render: () => ({
    components: { MDCheckbox },
    template: `
      <div data-testid="md-checkbox-tab-order">
        <button type="button" id="tab-order-before">Before</button>
        <MDCheckbox id="tab-order-disabled" aria-label="Disabled tab order" disabled />
        <MDCheckbox id="tab-order-presentation" presentation checked />
        <button type="button" id="tab-order-after">After</button>
      </div>
    `,
  }),
};

export const TargetHitArea: Story = {
  render: () => ({
    components: { MDCheckbox },
    setup() {
      const checked = ref(false);
      const toggleCount = ref(0);
      // Completes the controlled `v-model:checked`-style round trip: the `beforeinput`-derived
      // contract calls `preventDefault()` before any renderer mutation, so the rendered `checked`
      // only ever changes when the owning consumer writes the emitted value back into `checked`
      // (ARCHITECTURE.md "State precedence and restoration").
      const onUpdateChecked = (value: boolean) => {
        checked.value = value;
        toggleCount.value += 1;
      };
      return { checked, onUpdateChecked, toggleCount };
    },
    template: `
      <div data-testid="visual-md-checkbox-target-hit">
        <MDCheckbox aria-label="Target hit" :checked="checked" @update:checked="onUpdateChecked" />
        <output id="visual-md-checkbox-target-hit-count">{{ toggleCount }}</output>
      </div>
    `,
  }),
};

export const HostAttributeBoundary: Story = {
  render: () => ({
    components: { MDCheckbox },
    setup() {
      // `checked`/`indeterminate` are deliberately excluded here: unlike Switch (whose public
      // prop `selected` is a distinct name from the renderer's `checked`), Checkbox's public
      // props are named identically to the renderer properties they control, so binding them
      // through `v-bind` is the legitimate controlled contract, not an attempted forbidden
      // override — that contract is proven by the "maps explicit checked/indeterminate" unit
      // tests, not this fixture. This fixture attempts only renderer-private/forbidden surface:
      // `name`, `required`, `value`, and an unknown attribute.
      const attemptedOverrides = ref<Record<string, unknown>>({
        name: 'bogus-name',
        required: true,
        value: 'bogus-value',
      });
      const clickCount = ref(0);
      const onClick = () => {
        clickCount.value += 1;
      };
      const toggleAttemptedOverrides = () => {
        attemptedOverrides.value = {
          ...attemptedOverrides.value,
          name: attemptedOverrides.value.name === 'bogus-name' ? 'other-name' : 'bogus-name',
          required: !attemptedOverrides.value.required,
        };
      };
      return { attemptedOverrides, clickCount, onClick, toggleAttemptedOverrides };
    },
    template: `
      <div data-testid="md-checkbox-host-attribute-boundary">
        <MDCheckbox
          data-testid="host-boundary-checkbox"
          aria-label="Boundary checkbox"
          v-bind="attemptedOverrides"
          @click="onClick"
        />
        <output data-testid="host-boundary-click-count">{{ clickCount }}</output>
        <button type="button" data-testid="host-boundary-toggle" @click="toggleAttemptedOverrides">
          Toggle attempted overrides
        </button>
      </div>
    `,
  }),
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDCheckbox },
    template: `
      <div data-testid="visual-md-checkbox-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDCheckbox aria-label="Unselected" />
          <MDCheckbox aria-label="Selected" checked />
          <MDCheckbox aria-label="Indeterminate" indeterminate />
        </div>
        <div class="visual-row">
          <MDCheckbox aria-label="Disabled unselected" disabled />
          <MDCheckbox aria-label="Disabled selected" checked disabled />
          <MDCheckbox aria-label="Disabled indeterminate" indeterminate disabled />
        </div>
        <div class="visual-row">
          <MDCheckbox aria-label="Presentation unselected" presentation />
          <MDCheckbox aria-label="Presentation selected" presentation checked />
          <MDCheckbox aria-label="Presentation indeterminate" presentation indeterminate />
        </div>
      </div>
    `,
  }),
};

// Isolated single-checkbox fixture for real pointer/keyboard hover/focus/pressed proof
// (ARCHITECTURE.md "Implementation passes" #10 covers hover/focus/pressed visual states).
export const RealInteractionFeedback: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDCheckbox },
    template: `
      <div data-testid="visual-md-checkbox-real-interaction">
        <MDCheckbox aria-label="Press me" />
      </div>
    `,
  }),
};
