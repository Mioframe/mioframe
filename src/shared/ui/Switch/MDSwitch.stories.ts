import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import MDSwitch from './MDSwitch.vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import { MDStateLayerForcedStateProvider } from '../State/testing';
import { useFocusIndicator } from '../State/useFocusIndicator';

const meta = {
  title: 'shared/ui/MDSwitch',
  component: MDSwitch,
  args: {
    ariaLabel: 'Error diagnostics',
    id: 'storybook-md-switch-default',
    selected: false,
  },
  argTypes: {
    'onUpdate:selected': { action: 'update:selected' },
    onChange: { action: 'change' },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

// Storybook uses visual-checker-backdrop (a neutral checkerboard alias) so any transparent
// Switch surface is unambiguous in screenshots, matching the pattern used by MDList stories.
const switchStatesTemplate = `
  <div data-testid="visual-md-switch-states" class="visual-checker-backdrop">
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-off" aria-label="Off" :selected="false" />
      <span>Off</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-on" aria-label="On" :selected="true" />
      <span>On</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-disabled-off" aria-label="Disabled off" :selected="false" disabled />
      <span>Disabled off</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-disabled-on" aria-label="Disabled on" :selected="true" disabled />
      <span>Disabled on</span>
    </div>
  </div>
`;

const switchInteractionStatesTemplate = `
  <div data-testid="visual-md-switch-interaction-states" class="visual-checker-backdrop">
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-hover-off" aria-label="Hover off" :selected="false" />
      </MDStateLayerForcedStateProvider>
      <span>Hover off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider focused>
        <MDSwitch id="storybook-md-switch-focus-off" aria-label="Focus off" :selected="false" />
      </MDStateLayerForcedStateProvider>
      <span>Focus off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-pressed-off" aria-label="Pressed off" :selected="false" />
      </MDStateLayerForcedStateProvider>
      <span>Pressed off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-hover-on" aria-label="Hover on" :selected="true" />
      </MDStateLayerForcedStateProvider>
      <span>Hover on</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider focused>
        <MDSwitch id="storybook-md-switch-focus-on" aria-label="Focus on" :selected="true" />
      </MDStateLayerForcedStateProvider>
      <span>Focus on</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-pressed-on" aria-label="Pressed on" :selected="true" />
      </MDStateLayerForcedStateProvider>
      <span>Pressed on</span>
    </div>
  </div>
`;

const switchIconStatesTemplate = `
  <div data-testid="visual-md-switch-icon-states" class="visual-checker-backdrop">
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-off" aria-label="Off with icon" :selected="false">
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Unselected icon</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-on" aria-label="On with icon" :selected="true">
        <template #selected-icon><MDSymbol name="check" /></template>
      </MDSwitch>
      <span>Selected icon</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-both-off" aria-label="Both icons off" :selected="false">
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Both icons (off)</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-both-on" aria-label="Both icons on" :selected="true">
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Both icons (on)</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-disabled-off" aria-label="Disabled with icon off" :selected="false" disabled>
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Disabled with icons (off)</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-disabled-on" aria-label="Disabled with icon on" :selected="true" disabled>
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Disabled with icons (on)</span>
    </div>
  </div>
`;

const switchIconInteractionStatesTemplate = `
  <div data-testid="visual-md-switch-icon-interaction-states" class="visual-checker-backdrop">
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-icon-hover-off" aria-label="Icon hover off" :selected="false">
          <template #selected-icon><MDSymbol name="check" /></template>
          <template #unselected-icon><MDSymbol name="close" /></template>
        </MDSwitch>
      </MDStateLayerForcedStateProvider>
      <span>Icon hover off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-icon-pressed-off" aria-label="Icon pressed off" :selected="false">
          <template #selected-icon><MDSymbol name="check" /></template>
          <template #unselected-icon><MDSymbol name="close" /></template>
        </MDSwitch>
      </MDStateLayerForcedStateProvider>
      <span>Icon pressed off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-icon-hover-on" aria-label="Icon hover on" :selected="true">
          <template #selected-icon><MDSymbol name="check" /></template>
          <template #unselected-icon><MDSymbol name="close" /></template>
        </MDSwitch>
      </MDStateLayerForcedStateProvider>
      <span>Icon hover on</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-icon-pressed-on" aria-label="Icon pressed on" :selected="true">
          <template #selected-icon><MDSymbol name="check" /></template>
          <template #unselected-icon><MDSymbol name="close" /></template>
        </MDSwitch>
      </MDStateLayerForcedStateProvider>
      <span>Icon pressed on</span>
    </div>
  </div>
`;

const targetHitAreaTemplate = `
  <div id="visual-md-switch-target-hit" class="visual-checker-backdrop">
    <MDSwitch
      id="storybook-md-switch-target-hit"
      aria-label="Expanded target"
      :selected="selected"
      @change="onChange"
      @update:selected="onUpdateSelected"
    />
    <span id="visual-md-switch-target-hit-count">{{ changeCount }}</span>
  </div>
`;

const dragTemplate = `
  <div id="visual-md-switch-drag" class="visual-checker-backdrop">
    <MDSwitch
      id="storybook-md-switch-drag"
      aria-label="Drag switch"
      :selected="selected"
      @change="onChange"
      @update:selected="onUpdateSelected"
    />
    <span id="visual-md-switch-drag-count">{{ changeCount }}</span>
    <span id="visual-md-switch-drag-value">{{ selected }}</span>
  </div>
`;

const targetHitAreaStory = () => ({
  components: { MDSwitch },
  setup: () => {
    const changeCount = ref(0);
    const selected = ref(false);

    const onChange = () => {
      changeCount.value += 1;
    };

    const onUpdateSelected = (value: boolean) => {
      selected.value = value;
    };

    return {
      changeCount,
      selected,
      onChange,
      onUpdateSelected,
    };
  },
  template: targetHitAreaTemplate,
});

const dragStory = () => ({
  components: { MDSwitch },
  setup: () => {
    const changeCount = ref(0);
    const selected = ref(false);

    const onChange = () => {
      changeCount.value += 1;
    };

    const onUpdateSelected = (value: boolean) => {
      selected.value = value;
    };

    return {
      changeCount,
      selected,
      onChange,
      onUpdateSelected,
    };
  },
  template: dragTemplate,
});

export const Default: Story = {};

export const On: Story = {
  args: {
    selected: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    selected: true,
  },
};

export const WithSelectedIcon: Story = {
  args: {
    selected: true,
  },
  render: (args) => ({
    components: { MDSwitch, MDSymbol },
    setup: () => args,
    template: `
      <MDSwitch v-bind="$props">
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
    `,
  }),
};

export const LabeledWithAriaLabelledby: Story = {
  render: () => ({
    components: { MDSwitch },
    setup: () => {
      const selected = ref(false);
      return { selected };
    },
    template: `
      <div style="display:flex;align-items:center;gap:12px">
        <span id="switch-label-example">Send error reports</span>
        <MDSwitch
          id="storybook-md-switch-labeled"
          aria-labelledby="switch-label-example"
          :selected="selected"
          @update:selected="selected = $event"
        />
      </div>
    `,
  }),
};

export const ExpandedTargetHitArea: Story = {
  render: targetHitAreaStory,
};

export const DragInteraction: Story = {
  render: dragStory,
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDSwitch },
    template: switchStatesTemplate,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDSwitch, MDStateLayerForcedStateProvider },
    template: switchInteractionStatesTemplate,
  }),
};

export const VisualIconStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDSwitch, MDSymbol },
    template: switchIconStatesTemplate,
  }),
};

export const VisualIconInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDSwitch, MDSymbol, MDStateLayerForcedStateProvider },
    template: switchIconInteractionStatesTemplate,
  }),
};

export const FocusIndicatorTarget: Story = {
  render: () => ({
    components: { MDSwitch },
    setup() {
      useFocusIndicator();
    },
    template: `
      <div id="visual-md-switch-focus-indicator">
        <MDSwitch
          id="storybook-md-switch-focus"
          aria-label="Focus target"
          :selected="false"
        />
      </div>
    `,
  }),
};
