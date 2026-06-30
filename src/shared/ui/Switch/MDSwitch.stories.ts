import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import MDSwitch from './MDSwitch.vue';
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

const switchStatesTemplate = `
  <div data-testid="visual-md-switch-states" class="visual-switch-surface">
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
  <div data-testid="visual-md-switch-interaction-states" class="visual-switch-surface">
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

const targetHitAreaTemplate = `
  <div id="visual-md-switch-target-hit" class="visual-switch-surface">
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

export const ExpandedTargetHitArea: Story = {
  render: targetHitAreaStory,
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
