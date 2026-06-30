import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import MDSwitch from './MDSwitch.vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import { MDStateLayerForcedStateProvider } from '../State/testing';

const meta = {
  title: 'shared/ui/MDSwitch',
  component: MDSwitch,
  args: {
    ariaLabel: 'Error diagnostics',
    id: 'storybook-md-switch-default',
    modelValue: false,
  },
  argTypes: {
    'onUpdate:modelValue': { action: 'update:modelValue' },
    onClick: { action: 'click' },
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
      <MDSwitch id="storybook-md-switch-off" aria-label="Off" :model-value="false" />
      <span>Off</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-on" aria-label="On" :model-value="true" />
      <span>On</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-disabled-off" aria-label="Disabled off" :model-value="false" disabled />
      <span>Disabled off</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-disabled-on" aria-label="Disabled on" :model-value="true" disabled />
      <span>Disabled on</span>
    </div>
  </div>
`;

const switchInteractionStatesTemplate = `
  <div data-testid="visual-md-switch-interaction-states" class="visual-checker-backdrop">
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-hover-off" aria-label="Hover off" :model-value="false" />
      </MDStateLayerForcedStateProvider>
      <span>Hover off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider focused>
        <MDSwitch id="storybook-md-switch-focus-off" aria-label="Focus off" :model-value="false" />
      </MDStateLayerForcedStateProvider>
      <span>Focus off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-pressed-off" aria-label="Pressed off" :model-value="false" />
      </MDStateLayerForcedStateProvider>
      <span>Pressed off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-hover-on" aria-label="Hover on" :model-value="true" />
      </MDStateLayerForcedStateProvider>
      <span>Hover on</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider focused>
        <MDSwitch id="storybook-md-switch-focus-on" aria-label="Focus on" :model-value="true" />
      </MDStateLayerForcedStateProvider>
      <span>Focus on</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-pressed-on" aria-label="Pressed on" :model-value="true" />
      </MDStateLayerForcedStateProvider>
      <span>Pressed on</span>
    </div>
  </div>
`;

const switchIconStatesTemplate = `
  <div data-testid="visual-md-switch-icon-states" class="visual-checker-backdrop">
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-off" aria-label="Off with icon" :model-value="false">
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Unselected icon</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-on" aria-label="On with icon" :model-value="true">
        <template #selected-icon><MDSymbol name="check" /></template>
      </MDSwitch>
      <span>Selected icon</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-both-off" aria-label="Both icons off" :model-value="false">
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Both icons (off)</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-both-on" aria-label="Both icons on" :model-value="true">
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Both icons (on)</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-disabled-off" aria-label="Disabled with icon off" :model-value="false" disabled>
        <template #selected-icon><MDSymbol name="check" /></template>
        <template #unselected-icon><MDSymbol name="close" /></template>
      </MDSwitch>
      <span>Disabled with icons (off)</span>
    </div>
    <div class="visual-row">
      <MDSwitch id="storybook-md-switch-icon-disabled-on" aria-label="Disabled with icon on" :model-value="true" disabled>
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
        <MDSwitch id="storybook-md-switch-icon-hover-off" aria-label="Icon hover off" :model-value="false">
          <template #selected-icon><MDSymbol name="check" /></template>
          <template #unselected-icon><MDSymbol name="close" /></template>
        </MDSwitch>
      </MDStateLayerForcedStateProvider>
      <span>Icon hover off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-icon-pressed-off" aria-label="Icon pressed off" :model-value="false">
          <template #selected-icon><MDSymbol name="check" /></template>
          <template #unselected-icon><MDSymbol name="close" /></template>
        </MDSwitch>
      </MDStateLayerForcedStateProvider>
      <span>Icon pressed off</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-icon-hover-on" aria-label="Icon hover on" :model-value="true">
          <template #selected-icon><MDSymbol name="check" /></template>
          <template #unselected-icon><MDSymbol name="close" /></template>
        </MDSwitch>
      </MDStateLayerForcedStateProvider>
      <span>Icon hover on</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-icon-pressed-on" aria-label="Icon pressed on" :model-value="true">
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
      :model-value="modelValue"
      @click="onClick"
      @update:model-value="onUpdateModelValue"
    />
    <span id="visual-md-switch-target-hit-count">{{ clickCount }}</span>
  </div>
`;

const dragTemplate = `
  <div id="visual-md-switch-drag" class="visual-checker-backdrop">
    <MDSwitch
      id="storybook-md-switch-drag"
      aria-label="Drag switch"
      :model-value="modelValue"
      @click="onClick"
      @update:model-value="onUpdateModelValue"
    />
    <span id="visual-md-switch-drag-count">{{ clickCount }}</span>
    <span id="visual-md-switch-drag-value">{{ modelValue }}</span>
  </div>
`;

const targetHitAreaStory = () => ({
  components: { MDSwitch },
  setup: () => {
    const clickCount = ref(0);
    const modelValue = ref(false);

    const onClick = () => {
      clickCount.value += 1;
    };

    const onUpdateModelValue = (value: boolean) => {
      modelValue.value = value;
    };

    return {
      clickCount,
      modelValue,
      onClick,
      onUpdateModelValue,
    };
  },
  template: targetHitAreaTemplate,
});

const dragStory = () => ({
  components: { MDSwitch },
  setup: () => {
    const clickCount = ref(0);
    const modelValue = ref(false);

    const onClick = () => {
      clickCount.value += 1;
    };

    const onUpdateModelValue = (value: boolean) => {
      modelValue.value = value;
    };

    return {
      clickCount,
      modelValue,
      onClick,
      onUpdateModelValue,
    };
  },
  template: dragTemplate,
});

export const Default: Story = {};

export const On: Story = {
  args: {
    modelValue: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    modelValue: true,
  },
};

export const WithSelectedIcon: Story = {
  args: {
    modelValue: true,
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
      const checked = ref(false);
      return { checked };
    },
    template: `
      <div style="display:flex;align-items:center;gap:12px">
        <span id="switch-label-example">Send error reports</span>
        <MDSwitch
          id="storybook-md-switch-labeled"
          aria-labelledby="switch-label-example"
          :model-value="checked"
          @update:model-value="checked = $event"
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
