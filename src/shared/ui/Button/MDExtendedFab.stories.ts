import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDExtendedFab from './MDExtendedFab.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDExtendedFab',
  component: MDExtendedFab,
  args: {
    label: 'Add',
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
          'Checked against Material 3 `components/extended-fab/{overview,guidelines,specs,accessibility}`.',
          '',
          '**Props**: `size` (`small` | `medium` | `large`, default `small`), `color` (`primary` | `secondary` | `tertiary` | `primary-container` | `secondary-container` | `tertiary-container`, default `primary-container`), required `label`, optional `tooltip` (also used as the accessible name fallback).',
          '',
          '**Slots**: `icon` (optional).',
          '',
          '**Project extension**: `loading` (`boolean | number`, `0` is active).',
          '',
          '**Tokens**: `--md-comp-extended-fab-*` component tokens resolve to `--md-sys-*`; label typescale now follows size (`small`→title-medium, `medium`→title-large, `large`→headline-small) per the official spec, replacing the previous fixed title-medium label.',
          '',
          '**Color terminology**: `*-container` replaces the legacy `tonal-*` naming; `primary-container` preserves the previous `tonal-primary` visual default.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDExtendedFab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDExtendedFab },
    template: `
        <div data-testid="visual-md-extended-fab-states" class="visual-surface">
        <div class="visual-row">
          <MDExtendedFab label="Add" md-symbol="add" />
          <MDExtendedFab label="Share" color="secondary-container" md-symbol="share" />
          <MDExtendedFab label="Archive" color="primary" md-symbol="archive" />
        </div>
        <div class="visual-row">
          <MDExtendedFab label="Medium" size="medium" color="tertiary-container" md-symbol="star" />
          <MDExtendedFab label="Large" size="large" color="secondary" md-symbol="menu" />
        </div>
      </div>
    `,
  }),
};
