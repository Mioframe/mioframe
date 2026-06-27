import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
  <div data-testid="visual-md-switch-states" class="visual-surface">
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
  <div data-testid="visual-md-switch-interaction-states" class="visual-surface">
    <div class="visual-row">
      <MDStateLayerForcedStateProvider hovered>
        <MDSwitch id="storybook-md-switch-hover" aria-label="Hover" :model-value="false" />
      </MDStateLayerForcedStateProvider>
      <span>Hover</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider focused>
        <MDSwitch id="storybook-md-switch-focus" aria-label="Focus" :model-value="true" />
      </MDStateLayerForcedStateProvider>
      <span>Focus</span>
    </div>
    <div class="visual-row">
      <MDStateLayerForcedStateProvider pressed>
        <MDSwitch id="storybook-md-switch-pressed" aria-label="Pressed" :model-value="false" />
      </MDStateLayerForcedStateProvider>
      <span>Pressed</span>
    </div>
  </div>
`;

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
