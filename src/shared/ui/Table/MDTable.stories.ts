import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDTable from './MDTable.vue';

const meta = {
  title: 'Shared/Table/MDTable',
  component: MDTable,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MDTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => ({
    components: { MDTable },
    template: `
      <MDTable>
        <colgroup>
          <col style="width: 30%" />
          <col style="width: 35%" />
          <col style="width: 35%" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Design review</td>
            <td>Ready</td>
            <td>Today</td>
          </tr>
          <tr>
            <td>Implementation</td>
            <td>In progress</td>
            <td>Yesterday</td>
          </tr>
          <tr>
            <td>Verification</td>
            <td>Queued</td>
            <td>Monday</td>
          </tr>
        </tbody>
      </MDTable>
    `,
  }),
};
