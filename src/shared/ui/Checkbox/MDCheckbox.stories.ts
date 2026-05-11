import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDCheckbox from './MDCheckbox.vue';

const meta = {
  title: 'shared/ui/MDCheckbox',
  component: MDCheckbox,
  tags: ['visual'],
  args: {
    ariaLabel: 'Diagnostics',
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
    template: `
      <div data-testid="visual-md-checkbox-states" class="visual-surface">
        <div class="visual-row">
          <MDCheckbox aria-label="Unchecked" :model-value="false" />
          <span>Unchecked</span>
        </div>
        <div class="visual-row">
          <MDCheckbox aria-label="Checked" :model-value="true" />
          <span>Checked</span>
        </div>
        <div class="visual-row">
          <MDCheckbox aria-label="Indeterminate" indeterminate />
          <span>Indeterminate</span>
        </div>
        <div class="visual-row">
          <MDCheckbox aria-label="Disabled" :model-value="true" disabled />
          <span>Disabled</span>
        </div>
        <div class="visual-row">
          <MDCheckbox aria-label="Readonly" :model-value="true" readonly />
          <span>Readonly</span>
        </div>
      </div>
    `,
  }),
};
