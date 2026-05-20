import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDCheckbox from './MDCheckbox.vue';

const meta = {
  title: 'shared/ui/MDCheckbox',
  component: MDCheckbox,
  args: {
    ariaLabel: 'Diagnostics',
    id: 'storybook-md-checkbox-default',
    modelValue: false,
  },
  argTypes: {
    'onUpdate:modelValue': { action: 'update:modelValue' },
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

const checkboxStatesTemplate = `
  <div data-testid="visual-md-checkbox-states" class="visual-surface">
    <div class="visual-row">
      <MDCheckbox id="storybook-md-checkbox-unchecked" aria-label="Unchecked" :model-value="false" />
      <span>Unchecked</span>
    </div>
    <div class="visual-row">
      <MDCheckbox id="storybook-md-checkbox-checked" aria-label="Checked" :model-value="true" />
      <span>Checked</span>
    </div>
    <div class="visual-row">
      <MDCheckbox id="storybook-md-checkbox-indeterminate" aria-label="Indeterminate" indeterminate />
      <span>Indeterminate</span>
    </div>
    <div class="visual-row">
      <MDCheckbox id="storybook-md-checkbox-disabled" aria-label="Disabled" :model-value="true" disabled />
      <span>Disabled</span>
    </div>
    <div class="visual-row">
      <MDCheckbox id="storybook-md-checkbox-readonly" aria-label="Readonly" :model-value="true" readonly />
      <span>Readonly</span>
    </div>
  </div>
`;

const checkboxInteractionStatesTemplate = `
  <div data-testid="visual-md-checkbox-interaction-states" class="visual-surface">
    <div class="visual-row">
      <MDCheckbox class="md-state_hover" id="storybook-md-checkbox-hover" aria-label="Hover" :model-value="false" />
      <span>Hover</span>
    </div>
    <div class="visual-row">
      <MDCheckbox class="md-state_focused" id="storybook-md-checkbox-focus" aria-label="Focus" :model-value="true" />
      <span>Focus</span>
    </div>
    <div class="visual-row">
      <MDCheckbox class="md-state_pressed" id="storybook-md-checkbox-pressed" aria-label="Pressed" :model-value="false" />
      <span>Pressed</span>
    </div>
    <div class="visual-row">
      <MDCheckbox class="md-state_hover" id="storybook-md-checkbox-readonly-hover" aria-label="Readonly hover" :model-value="true" readonly />
      <span>Readonly hover</span>
    </div>
  </div>
`;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    modelValue: true,
  },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    modelValue: undefined,
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
    components: { MDCheckbox },
    template: checkboxStatesTemplate,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDCheckbox },
    template: checkboxInteractionStatesTemplate,
  }),
};
