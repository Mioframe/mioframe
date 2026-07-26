import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { useFocusIndicator } from '../../../State/useFocusIndicator';
import MDButton from './MDButton.vue';
import MDButtonTargetHitVisualStory from './MDButtonTargetHitVisualStory.vue';

const meta = {
  title: 'Material 3/Components/Buttons/MDButton',
  component: MDButton,
  args: { color: 'filled', label: 'Save' },
  argTypes: { onClick: { action: 'click' } },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mioframe Button adapter backed privately by @m3e/web. Supports five appearances and sizes, round/square shapes, disabled, controlled toggle intent, native form types, a leading icon slot, and the loading extension.',
      },
    },
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
      <div data-testid="visual-md-button-states" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Filled" color="filled"><template #icon>+</template></MDButton>
          <MDButton label="Outlined" color="outlined"><template #icon>+</template></MDButton>
          <MDButton label="Text" color="text"><template #icon>+</template></MDButton>
        </div>
        <div class="visual-row">
          <MDButton label="Tonal" color="tonal"><template #icon>+</template></MDButton>
          <MDButton label="Elevated" color="elevated"><template #icon>+</template></MDButton>
        </div>
        <div class="visual-row">
          <MDButton label="Disabled filled" disabled><template #icon>+</template></MDButton>
          <MDButton label="Disabled outlined" color="outlined" disabled><template #icon>+</template></MDButton>
          <MDButton label="Disabled text" color="text" disabled><template #icon>+</template></MDButton>
        </div>
      </div>
    `,
  }),
};

export const SizeGeometryMatrix: Story = {
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-size-geometry" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Extra small" size="extra-small"><template #icon>+</template></MDButton>
          <MDButton label="Small" size="small"><template #icon>+</template></MDButton>
          <MDButton label="Medium" size="medium"><template #icon>+</template></MDButton>
        </div>
        <div class="visual-row">
          <MDButton label="Large" size="large"><template #icon>+</template></MDButton>
          <MDButton label="Extra large" size="extra-large"><template #icon>+</template></MDButton>
        </div>
      </div>
    `,
  }),
};

export const ToggleShapes: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-toggle-shapes" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Round selected" variant="toggle" selected color="tonal" />
          <MDButton label="Round unselected" variant="toggle" color="tonal" />
        </div>
        <div class="visual-row">
          <MDButton label="Square selected" variant="toggle" selected shape="square" color="tonal" />
          <MDButton label="Square unselected" variant="toggle" shape="square" color="tonal" />
        </div>
      </div>
    `,
  }),
};

export const DisabledSelectedOutlinedAndText: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-button-disabled-selected-outlined-text" class="visual-checker-backdrop">
        <div class="visual-row">
          <MDButton label="Outlined unselected" variant="toggle" disabled color="outlined" />
          <MDButton label="Outlined selected" variant="toggle" selected disabled color="outlined" />
          <MDButton label="Text disabled" disabled color="text" />
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

export const FocusIndicatorTarget: Story = {
  render: () => ({
    components: { MDButton },
    setup() {
      useFocusIndicator();
    },
    template: `
      <div class="visual-checker-backdrop" style="position:fixed;inset:0;">
        <div id="visual-md-button-focus-indicator" style="position:absolute;inset:auto 12px 12px auto;">
          <MDButton label="Focus target" />
        </div>
      </div>
    `,
  }),
};

export const BehaviorContracts: Story = {
  render: () => ({
    components: { MDButton },
    setup() {
      const selected = ref(false);
      const submitCount = ref(0);
      const loadingClickCount = ref(0);
      const disabledClickCount = ref(0);
      const onSubmit = () => {
        submitCount.value += 1;
      };
      const onUpdateSelected = (nextSelected: boolean) => {
        selected.value = nextSelected;
      };
      const onLoadingClick = () => {
        loadingClickCount.value += 1;
      };
      const onDisabledClick = () => {
        disabledClickCount.value += 1;
      };
      return {
        disabledClickCount,
        loadingClickCount,
        onDisabledClick,
        onLoadingClick,
        onSubmit,
        onUpdateSelected,
        selected,
        submitCount,
      };
    },
    template: `
      <div data-testid="md-button-behavior-contracts">
        <form aria-label="Button form" @submit.prevent="onSubmit">
          <MDButton label="Submit action" native-type="submit" />
        </form>
        <output id="md-button-submit-count">{{ submitCount }}</output>
        <MDButton label="Toggle action" variant="toggle" :selected="selected" @update:selected="onUpdateSelected" />
        <output id="md-button-selected">{{ selected }}</output>
        <MDButton label="Loading action" loading @click="onLoadingClick" />
        <output id="md-button-loading-count">{{ loadingClickCount }}</output>
        <MDButton label="Disabled action" disabled @click="onDisabledClick" />
        <output id="md-button-disabled-count">{{ disabledClickCount }}</output>
        <MDButton label="Motion action" size="medium" />
      </div>
    `,
  }),
};
