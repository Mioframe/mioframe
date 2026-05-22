import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDButton from './MDButton.vue';
import MDButtonTargetHitVisualStory from './MDButtonTargetHitVisualStory.vue';

const meta = {
  title: 'shared/ui/MDButton',
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
  },
} satisfies Meta<typeof MDButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-states" class="visual-surface">
        <div class="visual-row">
          <MDButton label="Filled" color="filled" />
          <MDButton label="Outlined" color="outlined" />
          <MDButton label="Text" color="text" />
        </div>
        <div class="visual-row">
          <MDButton label="Tonal" color="tonal" />
          <MDButton label="Elevated" color="elevated" />
          <MDButton label="Disabled elevated" color="elevated" disabled />
        </div>
        <div class="visual-row">
          <MDButton label="Disabled filled" color="filled" disabled />
          <MDButton label="Disabled tonal" color="tonal" disabled />
          <MDButton label="Disabled outlined" color="outlined" disabled />
          <MDButton label="Disabled text" color="text" disabled />
        </div>
      </div>
    `,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-interaction-states" class="visual-surface">
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Hover" color="filled" />
          <MDButton class="md-state_focused" label="Focus" color="outlined" />
          <MDButton class="md-state_pressed" label="Pressed" color="tonal" />
        </div>
        <div class="visual-row">
          <MDButton class="md-state_hover" label="Outlined hover" color="outlined" />
          <MDButton class="md-state_focused" label="Outlined focus" color="outlined" />
          <MDButton class="md-state_pressed" label="Outlined pressed" color="outlined" />
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

export const TargetLayers: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-targets" class="visual-surface">
        <div class="visual-row">
          <MDButton label="XS target" size="extra-small" />
          <MDButton label="S target" size="small" />
        </div>
      </div>
    `,
  }),
};
