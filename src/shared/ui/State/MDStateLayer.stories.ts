import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDStateLayer from './MDStateLayer.vue';

const meta = {
  title: 'shared/ui/MDStateLayer',
  component: MDStateLayer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDStateLayer>;

export default meta;

type Story = StoryObj<typeof meta>;

const visualTemplate = `
  <div
    data-testid="visual-md-state-layer"
    style="display:flex;flex-direction:column;gap:16px;padding:24px;background:var(--md-sys-color-surface);"
  >
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);">
        <MDStateLayer />
        <span style="position:relative;z-index:1;">Default</span>
      </button>
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);">
        <MDStateLayer hover />
        <span style="position:relative;z-index:1;">Hover</span>
      </button>
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);">
        <MDStateLayer focused />
        <span style="position:relative;z-index:1;">Focus visible</span>
      </button>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);">
        <MDStateLayer pressed />
        <span style="position:relative;z-index:1;">Pressed</span>
      </button>
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);box-shadow:var(--md-sys-elevation-level2);">
        <MDStateLayer dragged />
        <span style="position:relative;z-index:1;">Dragged</span>
      </button>
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:20px;background:rgb(from var(--md-sys-color-on-surface) r g b / 0.12);color:rgb(from var(--md-sys-color-on-surface) r g b / 0.38);" disabled>
        <MDStateLayer hover focused pressed dragged disabled />
        <span style="position:relative;z-index:1;">Disabled visual</span>
      </button>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:28px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);">
        <MDStateLayer hover />
        <span style="position:relative;z-index:1;">Round bounds</span>
      </button>
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:160px;height:56px;border:0;border-radius:12px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);">
        <MDStateLayer hover />
        <span style="position:relative;z-index:1;">Square bounds</span>
      </button>
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:220px;height:40px;border:0;border-radius:999px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);">
        <MDStateLayer hover />
        <span style="position:relative;z-index:1;">Pill bounds</span>
      </button>
    </div>
  </div>
`;

const rippleTemplate = `
  <div
    data-testid="visual-md-state-layer-ripple"
    style="display:flex;flex-direction:column;gap:16px;padding:24px;background:var(--md-sys-color-surface);"
  >
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:180px;height:56px;border:0;border-radius:20px;background:var(--md-sys-color-tertiary-container);color:var(--md-sys-color-on-tertiary-container);">
        <MDStateLayer hover />
        <span style="position:relative;z-index:1;">Ripple enabled host</span>
      </button>
      <button style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:180px;height:56px;border:0;border-radius:20px;background:var(--md-sys-color-tertiary-container);color:var(--md-sys-color-on-tertiary-container);">
        <MDStateLayer disabled />
        <span style="position:relative;z-index:1;">Ripple disabled host</span>
      </button>
    </div>
  </div>
`;

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDStateLayer },
    template: visualTemplate,
  }),
};

export const VisualRippleModes: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDStateLayer },
    template: rippleTemplate,
  }),
};
