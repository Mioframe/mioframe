import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DatabaseVirtualizationCapabilityFixture from './DatabaseVirtualizationCapabilityFixture.vue';

const meta = {
  title: 'Entities/databaseData/DatabaseVirtualizationCapability',
  component: DatabaseVirtualizationCapabilityFixture,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Deterministic synthetic native-table fixture proving the native-table-first database DOM model (docs/database-virtualization.md) through the real shared useVirtualAxis adapter: semantic table structure, virtual spacer rows/columns, dynamic <tr>/<th> measurement, deep offsets, and logical accessibility metadata over partial DOM. Uses no worker/service/persistence and clones no production editor/relation/toolbar behavior.',
      },
    },
  },
} satisfies Meta<typeof DatabaseVirtualizationCapabilityFixture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { rowCount: 5000, colCount: 40 },
};
