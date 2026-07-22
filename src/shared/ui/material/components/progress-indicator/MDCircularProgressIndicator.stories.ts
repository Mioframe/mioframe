import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDCircularProgressIndicator from './MDCircularProgressIndicator.vue';

const meta = {
  title: 'Material 3/Components/Progress Indicators/MDCircularProgressIndicator',
  component: MDCircularProgressIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'Checked against Material 3 `components/progress-indicators/{overview,specs}` (circular variant only).',
          '',
          '**Props**: `progress` (`0`-`1` determinate value; omit for indeterminate), `size` (rendered diameter in CSS pixels, default `40`), `label` (accessible name; omit for the decorative `aria-hidden` default used by every current consumer).',
          '',
          '**Tokens**: `--md-comp-progress-indicator-active-indicator-color` / `-track-color`. The active-indicator route is also the public `--md-circular-progress-color` external contract, overridable by any consumer (e.g. `MDButton`).',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof MDCircularProgressIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Indeterminate: Story = {};

export const Determinate: Story = {
  args: {
    progress: 0.65,
  },
};

export const DeterminateEmpty: Story = {
  args: {
    progress: 0,
  },
};

export const Labeled: Story = {
  args: {
    progress: 0.4,
    label: 'Uploading',
  },
};

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDCircularProgressIndicator },
    template: `
      <div data-testid="visual-md-circular-progress-indicator-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDCircularProgressIndicator data-testid="progress-indeterminate" />
          <MDCircularProgressIndicator data-testid="progress-0" :progress="0" />
          <MDCircularProgressIndicator data-testid="progress-25" :progress="0.25" />
          <MDCircularProgressIndicator data-testid="progress-65" :progress="0.65" />
          <MDCircularProgressIndicator data-testid="progress-100" :progress="1" />
        </div>
        <div class="visual-row">
          <MDCircularProgressIndicator data-testid="progress-size-16" :size="16" :progress="0.5" />
          <MDCircularProgressIndicator data-testid="progress-size-24" :size="24" :progress="0.5" />
          <MDCircularProgressIndicator data-testid="progress-size-40" :size="40" :progress="0.5" />
          <MDCircularProgressIndicator data-testid="progress-size-64" :size="64" :progress="0.5" />
        </div>
      </div>
    `,
  }),
};

export const TokenRouting: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDCircularProgressIndicator },
    template: `
      <div data-testid="visual-md-circular-progress-indicator-token-routing" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDCircularProgressIndicator
            data-testid="progress-recolored"
            :progress="0.5"
            style="
              --md-circular-progress-color: rgb(200 20 60);
              --md-comp-progress-indicator-track-color: rgb(20 60 200);
            "
          />
        </div>
      </div>
    `,
  }),
};
