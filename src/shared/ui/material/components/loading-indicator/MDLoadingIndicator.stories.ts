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
          'Mioframe Material Loading indicator adapter backed privately by @m3e/web. Demand-scoped to the default/uncontained indeterminate presentation required by MDButton loading composition: an accessible purpose label, an optional numeric size (24-240 dp, default 48, clamped outside that range), and inherited active-indicator color.',
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

export const InheritedColorOnColoredSurfaces: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDLoadingIndicator },
    template: `
      <div data-testid="visual-md-loading-indicator-inherited-color" class="visual-checker-backdrop">
        <div class="visual-row">
          <span style="color: #6750a4;"><MDLoadingIndicator label="Primary colored" /></span>
          <span style="color: #ffffff; background: #6750a4; display: inline-flex; padding: 8px;">
            <MDLoadingIndicator label="On primary background" />
          </span>
        </div>
      </div>
    `,
  }),
};
