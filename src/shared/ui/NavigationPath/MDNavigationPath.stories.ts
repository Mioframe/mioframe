import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { MDButton } from '@shared/ui/material';
import MDNavigationPath from './MDNavigationPath.vue';

const meta = {
  title: 'shared/ui/NavigationPath/MDNavigationPath',
  component: MDNavigationPath,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MDNavigationPath>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonGeometryAndOverflow: Story = {
  args: { path: '/My Drive/Long project folder/Research materials/Final documents' },
  render: () => ({
    components: { MDButton, MDNavigationPath },
    setup() {
      const selectedPath = ref('none');
      const onClickPath = (path: string) => {
        selectedPath.value = path;
      };
      return { onClickPath, selectedPath };
    },
    template: `
      <div data-testid="navigation-path-contract" style="width: 320px">
        <MDButton data-testid="small-button-reference" label="Reference" color="text" size="small" />
        <MDNavigationPath
          path="/My Drive/Long project folder/Research materials/Final documents"
          @click="onClickPath"
        />
        <output data-testid="selected-navigation-path">{{ selectedPath }}</output>
      </div>
    `,
  }),
};
