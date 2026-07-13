import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDFab from './MDFab.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDFab',
  component: MDFab,
  args: {
    tooltip: 'Create item',
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
          '**Props**: `size` (`regular` | `medium` | `large`, default `regular`), `color` (`primary` | `secondary` | `tertiary` | `primary-container` | `secondary-container` | `tertiary-container`, default `primary-container`), required `tooltip`.',
          '',
          '**Slots**: `icon`.',
          '',
          '**Project extension**: `loading` (`boolean | number`, `0` is active).',
          '',
          '**Tokens**: `--md-comp-fab-*` component tokens resolve to `--md-sys-*`. State tokens use the current non-deprecated `hovered`/`focused`/`pressed` paths for all six color styles, including the `-container` styles (which have full confirmed state-layer, icon, and elevation token coverage). The cache also contains contradictory duplicate legacy `hover`/`focus` rows for the three plain styles that alias a different color role; those legacy rows are not used.',
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

export const InteractionStateTokens: Story = {
  render: () => ({
    components: { MDFab },
    template: `
      <div data-testid="visual-md-fab-interaction-state-tokens" class="visual-surface">
        <div class="visual-row">
          <MDFab data-testid="primary-resting" tooltip="Primary resting" color="primary" md-symbol="add" />
          <MDFab data-testid="primary-hover" class="md-state_hover" tooltip="Primary hover" color="primary" md-symbol="add" />
          <MDFab data-testid="primary-focus" class="md-state_focused" tooltip="Primary focus" color="primary" md-symbol="add" />
          <MDFab data-testid="primary-pressed" class="md-state_pressed" tooltip="Primary pressed" color="primary" md-symbol="add" />
        </div>
        <div class="visual-row">
          <MDFab data-testid="primary-container-resting" tooltip="Primary container resting" color="primary-container" md-symbol="add" />
          <MDFab data-testid="primary-container-hover" class="md-state_hover" tooltip="Primary container hover" color="primary-container" md-symbol="add" />
          <MDFab data-testid="primary-container-focus" class="md-state_focused" tooltip="Primary container focus" color="primary-container" md-symbol="add" />
          <MDFab data-testid="primary-container-pressed" class="md-state_pressed" tooltip="Primary container pressed" color="primary-container" md-symbol="add" />
        </div>
      </div>
    `,
  }),
};
