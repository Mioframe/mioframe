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
      const toggleCount = ref(0);
      const onUpdateSelected = () => {
        toggleCount.value += 1;
      };
      return { onUpdateSelected, toggleCount };
    },
    template: `
      <div data-testid="visual-md-switch-target-hit">
        <MDSwitch aria-label="Target hit" @update:selected="onUpdateSelected" />
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
