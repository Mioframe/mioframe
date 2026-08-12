import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useArgs } from 'storybook/preview-api';
import { ref } from 'vue';
import MDSwitch from './MDSwitch.vue';

const meta = {
  title: 'Material 3/Components/Switch/MDSwitch',
  component: MDSwitch,
  tags: ['autodocs'],
  args: { 'aria-label': 'Automatic updates', selected: false },
  argTypes: { 'onUpdate:selected': { action: 'update:selected' } },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mioframe Material Switch adapter backed privately by @m3e/web. Demand-scoped to the official standalone default (controlled `selected`, `disabled`) plus the Mioframe `presentation` composition extension used by decorative list-item toggles.',
      },
    },
  },
} satisfies Meta<typeof MDSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

// The Playground surface: Controls drive `selected` through Storybook's args, and a native
// toggle round-trips back into args via `useArgs` so Controls and direct interaction stay
// synchronized either way (docs/testing/storybook.md "Args and Controls"). `useArgs` is a
// Storybook preview hook, so it must run in the story's `render` function, not inside the
// returned Vue component's `setup()`.
export const Default: Story = {
  render: function Render() {
    const [args, updateArgs] = useArgs<{
      /** Official binary selection state. */
      selected?: boolean | undefined;
    }>();
    const onUpdateSelected = (selected: boolean) => {
      updateArgs({ selected });
    };

    return {
      components: { MDSwitch },
      setup() {
        return { args, onUpdateSelected };
      },
      template: '<MDSwitch v-bind="args" @update:selected="onUpdateSelected" />',
    };
  },
};

export const Selected: Story = {
  args: { selected: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Presentation: Story = {
  render: () => ({
    components: { MDSwitch },
    template: `
      <div
        data-testid="md-switch-presentation"
        role="switch"
        aria-checked="true"
        aria-label="Automatic updates"
        tabindex="0"
        style="display: inline-flex; align-items: center; gap: 8px;"
      >
        Automatic updates
        <MDSwitch presentation selected />
      </div>
    `,
  }),
};

// Controlled-state rejected-intent fixture (ARCHITECTURE.md "Acceptance criteria"): the switch
// stays at `selected: false` and the fixture's own handler only records the emitted intent
// instead of writing it back, so a real activation must leave the rendered `checked` unchanged.
export const RejectedIntent: Story = {
  render: () => ({
    components: { MDSwitch },
    setup() {
      const intentCount = ref(0);
      const lastIntent = ref<boolean | undefined>(undefined);
      const onUpdateSelected = (value: boolean) => {
        intentCount.value += 1;
        lastIntent.value = value;
      };
      return { intentCount, lastIntent, onUpdateSelected };
    },
    template: `
      <div data-testid="md-switch-rejected-intent">
        <MDSwitch aria-label="Rejected intent" :selected="false" @update:selected="onUpdateSelected" />
        <output id="md-switch-rejected-intent-count">{{ intentCount }}</output>
        <output id="md-switch-rejected-intent-value">{{ lastIntent }}</output>
      </div>
    `,
  }),
};

// `presentation` composition pass-through fixture (ARCHITECTURE.md "Implementation passes" #7):
// the fixture itself, not MDSwitch, owns the action handler and local `selected` state, matching
// the confirmed decorative list-item composition scenario. Pointer input on the visible decorative
// region must reach this owner's own action (the wrapping element, since `presentation`'s
// `pointer-events: none` makes the renderer host itself unreachable by pointer), and the owner's
// resulting state must flow back into `selected`/rendered `checked`.
export const PresentationComposition: Story = {
  render: () => ({
    components: { MDSwitch },
    setup() {
      const selected = ref(false);
      const disabled = ref(false);
      const toggleCount = ref(0);
      const onAction = () => {
        selected.value = !selected.value;
        toggleCount.value += 1;
      };
      return { disabled, onAction, selected, toggleCount };
    },
    template: `
      <div
        data-testid="md-switch-presentation-composition"
        role="switch"
        :aria-checked="selected ? 'true' : 'false'"
        :aria-disabled="disabled ? 'true' : 'false'"
        aria-label="Automatic updates"
        tabindex="0"
        style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer;"
        @click="onAction"
      >
        Automatic updates
        <MDSwitch presentation :selected="selected" :disabled="disabled" />
        <output id="md-switch-presentation-composition-count">{{ toggleCount }}</output>
      </div>
    `,
  }),
};

export const BehaviorContracts: Story = {
  render: () => ({
    components: { MDSwitch },
    setup() {
      const labelledSelected = ref(false);
      const standaloneSelected = ref(false);
      const changeCount = ref(0);
      const disabledSelected = ref(false);
      const onUpdateLabelled = (value: boolean) => {
        labelledSelected.value = value;
        changeCount.value += 1;
      };
      const onUpdateStandalone = (value: boolean) => {
        standaloneSelected.value = value;
      };
      return {
        changeCount,
        disabledSelected,
        labelledSelected,
        onUpdateLabelled,
        onUpdateStandalone,
        standaloneSelected,
      };
    },
    template: `
      <div data-testid="md-switch-behavior-contracts">
        <span id="behavior-labelledby-text">Labelledby switch</span>
        <MDSwitch id="behavior-labelled-switch" aria-labelledby="behavior-labelledby-text" :selected="labelledSelected" @update:selected="onUpdateLabelled" />
        <output id="md-switch-change-count">{{ changeCount }}</output>
        <MDSwitch aria-label="Standalone labelled switch" :selected="standaloneSelected" @update:selected="onUpdateStandalone" />
        <MDSwitch aria-label="Disabled switch" disabled :selected="disabledSelected" />
      </div>
    `,
  }),
};

export const TabOrderFixture: Story = {
  render: () => ({
    components: { MDSwitch },
    template: `
      <div data-testid="md-switch-tab-order">
        <button type="button" id="tab-order-before">Before</button>
        <MDSwitch id="tab-order-disabled" aria-label="Disabled tab order" disabled />
        <MDSwitch id="tab-order-presentation" presentation selected />
        <button type="button" id="tab-order-after">After</button>
      </div>
    `,
  }),
};

export const TargetHitArea: Story = {
  render: () => ({
    components: { MDSwitch },
    setup() {
      const selected = ref(false);
      const toggleCount = ref(0);
      // Completes the controlled `v-model:selected`-style round trip: the corrected
      // `beforeinput`-derived contract calls `preventDefault()` before any renderer mutation, so
      // the rendered `checked` only ever changes when the owning consumer writes the emitted
      // value back into `selected` (ARCHITECTURE.md "State precedence and restoration").
      const onUpdateSelected = (value: boolean) => {
        selected.value = value;
        toggleCount.value += 1;
      };
      return { onUpdateSelected, selected, toggleCount };
    },
    template: `
      <div data-testid="visual-md-switch-target-hit">
        <MDSwitch aria-label="Target hit" :selected="selected" @update:selected="onUpdateSelected" />
        <output id="visual-md-switch-target-hit-count">{{ toggleCount }}</output>
      </div>
    `,
  }),
};

export const HostAttributeBoundary: Story = {
  render: () => ({
    components: { MDSwitch },
    setup() {
      const attemptedOverrides = ref<Record<string, unknown>>({
        checked: true,
        icons: 'both',
        name: 'bogus-name',
        value: 'bogus-value',
      });
      const clickCount = ref(0);
      const onClick = () => {
        clickCount.value += 1;
      };
      const toggleAttemptedOverrides = () => {
        attemptedOverrides.value = {
          ...attemptedOverrides.value,
          checked: !attemptedOverrides.value.checked,
          icons: attemptedOverrides.value.icons === 'both' ? 'selected' : 'both',
        };
      };
      return { attemptedOverrides, clickCount, onClick, toggleAttemptedOverrides };
    },
    template: `
      <div data-testid="md-switch-host-attribute-boundary">
        <MDSwitch
          data-testid="host-boundary-switch"
          aria-label="Boundary switch"
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
    components: { MDSwitch },
    template: `
      <div data-testid="visual-md-switch-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDSwitch aria-label="Unselected" />
          <MDSwitch aria-label="Selected" selected />
        </div>
        <div class="visual-row">
          <MDSwitch aria-label="Disabled unselected" disabled />
          <MDSwitch aria-label="Disabled selected" selected disabled />
        </div>
        <div class="visual-row">
          <MDSwitch aria-label="Presentation unselected" presentation />
          <MDSwitch aria-label="Presentation selected" presentation selected />
        </div>
      </div>
    `,
  }),
};
