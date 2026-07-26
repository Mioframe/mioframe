import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, defineComponent, ref } from 'vue';
import { MDButton } from '@shared/ui/material';
import MDStateLayer from './MDStateLayer.vue';
import { useRipple } from './useRipple';
import { useStateLayer } from './useStateLayer';

const StateLayerDemoHost = defineComponent({
  components: { MDStateLayer },
  props: {
    label: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    enableRipple: {
      type: Boolean,
      default: true,
    },
    dragged: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const hostEl = ref<HTMLButtonElement | null>(null);
    const { hover, focused, durationPressedState } = useStateLayer(hostEl);

    useRipple(computed(() => (props.enableRipple && !props.disabled ? hostEl.value : undefined)));

    return {
      focused,
      hostEl,
      hover,
      durationPressedState,
      props,
    };
  },
  template: `
    <button
      ref="hostEl"
      type="button"
      class="demo-host"
      style="position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:160px;height:56px;padding:0 24px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);font:var(--md-sys-typescale-label-large-font);"
      :disabled="props.disabled"
      :class="{
        'md-state_hover': !props.disabled && hover,
        'md-state_focused': !props.disabled && focused,
        'md-state_pressed': !props.disabled && durationPressedState,
        'md-state_dragged': !props.disabled && props.dragged,
      }"
    >
      <MDStateLayer
        :hover="hover"
        :focused="focused"
        :pressed="durationPressedState"
        :dragged="props.dragged"
        :disabled="props.disabled"
      />
      <span class="demo-host__label" style="position:relative;z-index:1;">{{ props.label }}</span>
    </button>
  `,
});

const meta = {
  title: 'shared/ui/MDStateLayer',
  component: MDStateLayer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MDStateLayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const VisualStates: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDStateLayer, StateLayerDemoHost },
    template: `
      <div data-testid="visual-md-state-layer" class="visual-checker-backdrop visual-surface">
        <div class="visual-row">
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Default</span>
            <StateLayerDemoHost label="Default" :enable-ripple="false" />
          </div>
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Hover</span>
            <button class="demo-host md-state_hover" type="button" style="position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:160px;height:56px;padding:0 24px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);">
              <MDStateLayer hover />
              <span class="demo-host__label" style="position:relative;z-index:1;">Hover</span>
            </button>
          </div>
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Focus visible</span>
            <button class="demo-host md-state_focused" type="button" style="position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:160px;height:56px;padding:0 24px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);">
              <MDStateLayer focused />
              <span class="demo-host__label" style="position:relative;z-index:1;">Focus visible</span>
            </button>
          </div>
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Pressed</span>
            <button class="demo-host md-state_pressed" type="button" style="position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:160px;height:56px;padding:0 24px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);">
              <MDStateLayer pressed />
              <span class="demo-host__label" style="position:relative;z-index:1;">Pressed</span>
            </button>
          </div>
        </div>
        <div class="visual-row">
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Dragged</span>
            <button class="demo-host md-state_dragged" type="button" style="position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:160px;height:56px;padding:0 24px;border:0;border-radius:20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);box-shadow:var(--md-sys-elevation-level2);">
              <MDStateLayer dragged />
              <span class="demo-host__label" style="position:relative;z-index:1;">Dragged</span>
            </button>
          </div>
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Disabled</span>
            <button class="demo-host md-state_hover md-state_focused md-state_pressed md-state_dragged" type="button" disabled style="position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:160px;height:56px;padding:0 24px;border:0;border-radius:20px;background:rgb(from var(--md-sys-color-on-surface) r g b / 0.12);color:rgb(from var(--md-sys-color-on-surface) r g b / 0.38);">
              <MDStateLayer hover focused pressed dragged disabled />
              <span class="demo-host__label" style="position:relative;z-index:1;">Disabled</span>
            </button>
          </div>
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Ripple enabled</span>
            <StateLayerDemoHost label="Ripple host" />
          </div>
          <div class="visual-cell" style="display:grid;gap:8px;justify-items:start;">
            <span class="visual-label">Ripple disabled</span>
            <StateLayerDemoHost label="No ripple host" :enable-ripple="false" />
          </div>
        </div>
      </div>
    `,
  }),
};

export const VisualHostIntegration: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MDButton },
    template: `
      <div data-testid="visual-md-state-layer-hosts" class="visual-checker-backdrop visual-surface">
        <div class="visual-row">
          <MDButton label="Filled button" color="filled" />
          <MDButton label="Outlined button" color="outlined" />
          <MDButton label="Disabled button" color="tonal" disabled />
        </div>
        <div class="visual-row">
          <MDButton label="Text button" color="text" />
          <MDButton label="Selected toggle" color="filled" variant="toggle" selected />
          <MDButton label="Elevated button" color="elevated" />
        </div>
      </div>
    `,
  }),
};
