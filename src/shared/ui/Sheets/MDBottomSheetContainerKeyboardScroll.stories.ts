import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDBottomSheetContainerKeyboardScrollStoryHarness from './MDBottomSheetContainerKeyboardScrollStoryHarness.vue';

const meta = {
  title: 'shared/ui/Sheets/MDBottomSheetContainerKeyboardScrollStoryHarness',
  component: MDBottomSheetContainerKeyboardScrollStoryHarness,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MDBottomSheetContainerKeyboardScrollStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A bottom sheet tall enough to require internal scrolling, used by Playwright to verify that
 * focus-trap's Tab/Shift+Tab wrap-around keeps the newly focused element visible even though the
 * trap is configured with `preventScroll: true` (see `MDBottomSheetContainer2.vue`). No screenshot
 * coverage applies here; this fixture owns no visual contract.
 */
export const Default: Story = {};
