import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDFab from './MDFab.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDFab',
  component: MDFab,
  args: {
    tooltip: 'Create item',
    color: 'primary',
    mdSymbol: 'add',
  },
  argTypes: {
    onClick: { action: 'click' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'Checked against Material 3 `components/floating-action-button/{overview,guidelines,specs,accessibility}`.',
          '',
          '**Props**: `size` (`regular` | `medium` | `large`, default `regular`), `color` (`primary` | `secondary` | `tertiary` | `primary-container` | `secondary-container` | `tertiary-container`, default `primary`), required `tooltip`.',
          '',
          '**Slots**: `icon`.',
          '',
          '**Project extension**: `loading` (`boolean | number`, `0` is active).',
          '',
          '**Tokens**: `--md-comp-fab-*` component tokens resolve to `--md-sys-*`.',
          '',
          '**Required icon**: an icon source (`mdSymbol` or the `icon` slot) is required. Missing icon content logs a development warning and renders no fallback placeholder.',
          '',
          '**Color terminology**: `*-container` replaces the legacy `tonal-*` naming, matching the current Material 3 Expressive token names.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDFab>;

export default meta;

type Story = StoryObj<typeof meta>;

const fabStatesTemplate = `
  <div data-testid="visual-md-fab-states" class="visual-surface">
    <div class="visual-row">
      <MDFab tooltip="Primary" color="primary" md-symbol="add" />
      <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
      <MDFab tooltip="Primary container" color="primary-container" md-symbol="check" />
    </div>
    <div class="visual-row">
      <MDFab tooltip="Medium" size="medium" md-symbol="star" />
      <MDFab tooltip="Large" size="large" md-symbol="menu" />
      <MDFab tooltip="Tertiary" color="tertiary" md-symbol="share" />
    </div>
  </div>
`;

const fabInteractionStatesTemplate = `
  <div data-testid="visual-md-fab-interaction-states" class="visual-surface">
    <div class="visual-row">
      <MDFab class="md-state_hover" tooltip="Primary hover" color="primary" md-symbol="add" />
      <MDFab tooltip="Secondary" color="secondary" md-symbol="edit" />
      <MDFab tooltip="Primary container" color="primary-container" md-symbol="check" />
    </div>
    <div class="visual-row">
      <MDFab tooltip="Medium" size="medium" md-symbol="star" />
      <MDFab class="md-state_focused" tooltip="Focus" size="large" color="tertiary" md-symbol="share" />
      <MDFab class="md-state_pressed" tooltip="Pressed" color="secondary-container" md-symbol="menu" />
    </div>
  </div>
`;

export const Default: Story = {};

export const Secondary: Story = {
  args: {
    color: 'secondary',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDFab },
    template: fabStatesTemplate,
  }),
};

export const VisualInteractionStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDFab },
    template: fabInteractionStatesTemplate,
  }),
};
