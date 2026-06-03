import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, h, ref } from 'vue';
import MDFabContainer from './MDFabContainer.vue';
import MDExtendedFab from './MDExtendedFab.vue';
import { definePaneContainer } from '../Layout/useMDContainer';

/**
 * A minimal pane host for stories. Provides the pane container context that
 * MDFabContainer uses to anchor the floating surface, without requiring the
 * full MDSplitLayout + MDPane setup.
 */
const StoryPaneHost = defineComponent({
  name: 'StoryPaneHost',
  props: {
    width: { type: String, default: '400px' },
    height: { type: String, default: '500px' },
  },
  setup(props, { slots }) {
    const paneEl = ref<HTMLElement | null>(null);
    definePaneContainer(paneEl);

    return () =>
      h(
        'div',
        {
          ref: paneEl,
          class: 'story-pane-host',
          style: {
            width: props.width,
            height: props.height,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            position: 'relative',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-surface)',
          },
        },
        slots.default?.(),
      );
  },
});

const meta = {
  title: 'shared/ui/MDFabContainer',
  component: MDFabContainer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDFabContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { MDFabContainer, MDExtendedFab, StoryPaneHost },
    template: `
      <StoryPaneHost>
        <div style="height: 200px;" />
        <MDFabContainer>
          <MDExtendedFab label="Add" md-symbol="add" />
        </MDFabContainer>
      </StoryPaneHost>
    `,
  }),
};

/**
 * Verifies that the FAB remains anchored to the pane bottom when async pane
 * content changes shift the placeholder position in the scroll flow.
 *
 * Click "Load content" to simulate an async transition from loading state to
 * loaded content state. The visible FAB must stay at the pane bottom after
 * the placeholder moves.
 */
export const PaneAnchoringLoadingTransition: Story = {
  render: () => ({
    components: { MDFabContainer, MDExtendedFab, StoryPaneHost },
    setup() {
      const isLoading = ref(true);
      const loadContent = () => {
        isLoading.value = false;
      };
      return { isLoading, loadContent };
    },
    template: `
      <div id="fab-pane-host" style="display: flex; flex-direction: column; gap: 8px;">
        <StoryPaneHost id="fab-test-pane" width="400px" height="500px">
          <div v-if="isLoading" style="height: 80px; display: flex; align-items: center; padding: 16px;">
            Loading...
          </div>
          <template v-else>
            <div
              v-for="i in 6"
              :key="i"
              style="height: 48px; display: flex; align-items: center; padding: 0 16px;"
            >
              Item {{ i }}
            </div>
          </template>
          <MDFabContainer>
            <MDExtendedFab label="Add" md-symbol="add" />
          </MDFabContainer>
        </StoryPaneHost>
        <button id="fab-load-content" type="button" @click="loadContent">Load content</button>
      </div>
    `,
  }),
};
