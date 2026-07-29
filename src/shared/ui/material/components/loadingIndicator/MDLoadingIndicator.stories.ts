import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDLoadingIndicator from './MDLoadingIndicator.vue';

const meta = {
  title: 'Material 3/Components/Loading indicator/MDLoadingIndicator',
  component: MDLoadingIndicator,
  args: { label: 'Loading' },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mioframe Material Loading indicator adapter backed privately by @m3e/web. Demand-scoped to the default/uncontained indeterminate presentation: an accessible purpose label, an optional numeric size (24-240 dp, default 48, clamped outside that range), and the official primary active-indicator color with a public component-token override.',
      },
    },
  },
} satisfies Meta<typeof MDLoadingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SizeMatrix: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDLoadingIndicator },
    template: `
      <div data-testid="visual-md-loading-indicator-sizes" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDLoadingIndicator label="Size 24" :size="24" />
          <MDLoadingIndicator label="Size 32" :size="32" />
          <MDLoadingIndicator label="Size 40" :size="40" />
          <MDLoadingIndicator label="Default size 48" />
        </div>
      </div>
    `,
  }),
};

export const ColorContract: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDLoadingIndicator },
    template: `
      <div data-testid="visual-md-loading-indicator-colors" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDLoadingIndicator label="Default primary" />
          <MDLoadingIndicator
            label="Public color override"
            style="--md-comp-loading-indicator-active-indicator-color: #006e1c;"
          />
        </div>
      </div>
    `,
  }),
};
