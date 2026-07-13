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
          '**Tokens**: `--md-comp-extended-fab-*` component tokens resolve to `--md-sys-*`; icon-label gap follows size (`small`→8dp, `medium`→12dp, `large`→16dp) via `--md-comp-extended-fab-{small,medium,large}-icon-label-space`. State tokens use the current non-deprecated `hovered`/`focused`/`pressed` paths for all six color styles, including the `-container` styles; the cache also contains contradictory duplicate legacy `hover`/`focus` rows for the three plain styles, which are not used.',
          '',
          '**Typography**: the label uses the shared `MD_TYPESCALE` utility classes (no handwritten font CSS), mapped by size: `small`→title-medium, `medium`→title-large, `large`→headline-small.',
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

export const SizeGaps: Story = {
  render: () => ({
    components: { MDExtendedFab },
    template: `
      <div data-testid="visual-md-extended-fab-size-gaps" class="visual-surface">
        <div class="visual-row">
          <MDExtendedFab data-testid="gap-small" label="Small" size="small" md-symbol="add" />
          <MDExtendedFab data-testid="gap-medium" label="Medium" size="medium" md-symbol="add" />
          <MDExtendedFab data-testid="gap-large" label="Large" size="large" md-symbol="add" />
        </div>
      </div>
    `,
  }),
};

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
