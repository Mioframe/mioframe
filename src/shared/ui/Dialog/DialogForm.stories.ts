import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DialogForm from './DialogForm.vue';

const meta = {
  title: 'shared/ui/Dialog/DialogForm',
  component: DialogForm,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    headline: 'Confirm',
    supportingText: 'Apply the change?',
    applyLabel: 'Apply',
  },
} satisfies Meta<typeof DialogForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * `loading` disables every rendered action control (both apply and cancel),
 * leaving zero tabbable elements in the dialog body: the exact condition
 * that requires the form's own `fallbackFocus` for the real focus trap to
 * activate instead of throwing. Used by the Storybook browser behavior spec
 * proving real focus-trap fallback behavior.
 */
export const ZeroTabbableActions: Story = {
  args: {
    hasCancelAction: true,
    loading: true,
  },
};
