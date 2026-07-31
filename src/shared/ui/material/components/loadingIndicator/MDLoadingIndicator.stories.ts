import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
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

export const AttributeBoundary: Story = {
  render: () => ({
    components: { MDLoadingIndicator },
    setup() {
      const undeclaredActive = ref(false);
      const clickCount = ref(0);
      const toggleUndeclared = () => {
        undeclaredActive.value = !undeclaredActive.value;
      };
      const onClick = () => {
        clickCount.value += 1;
      };
      return { clickCount, onClick, toggleUndeclared, undeclaredActive };
    },
    template: `
      <div data-testid="md-loading-indicator-attribute-boundary">
        <button type="button" data-testid="toggle-undeclared-attrs" @click="toggleUndeclared">
          Toggle undeclared attrs
        </button>
        <output data-testid="attribute-boundary-click-count">{{ clickCount }}</output>
        <MDLoadingIndicator
          label="Attribute boundary"
          :aria-valuemax="undeclaredActive ? 83 : undefined"
          :aria-valuemin="undeclaredActive ? 17 : undefined"
          :aria-valuenow="undeclaredActive ? 63 : undefined"
          :contained="undeclaredActive ? true : undefined"
          :role="undeclaredActive ? 'alert' : undefined"
          :variant="undeclaredActive ? 'contained' : undefined"
          @click="onClick"
        />
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
