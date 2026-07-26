<script setup lang="ts">
import '@m3e/web/button';
import type {
  ButtonShape as RendererButtonShape,
  ButtonSize as RendererButtonSize,
  ButtonVariant as RendererButtonVariant,
  M3eButtonElement,
} from '@m3e/web/button';
import { isNumber } from 'es-toolkit/compat';
import { computed, defineComponent, h, onMounted, warn, watchEffect } from 'vue';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';

const props = withDefaults(
  defineProps<{
    /** Native button type. Defaults to `button` to avoid accidental form submission. */
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    /** Material Button appearance. */
    color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | undefined;
    /** Visible label and accessible name. */
    label: string;
    /** Blocks focus and activation through the renderer's documented disabled contract. */
    disabled?: boolean | undefined;
    /** Blocks activation while retaining focusability and disabled semantics. */
    disabledInteractive?: boolean | undefined;
    /** Optional filename when the Button acts as a download link. */
    download?: string | null | undefined;
    /** Optional URL that makes the Button act as a link. */
    href?: string | undefined;
    /** Shows an indeterminate or determinate progress indicator while preserving activation. */
    loading?: number | boolean | undefined;
    /** Form field name used by submit Buttons. */
    name?: string | undefined;
    /** Stateless action or consumer-controlled toggle intent. */
    variant?: 'default' | 'toggle' | undefined;
    /** Material Button size. */
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    /** Round or square container shape. */
    shape?: 'round' | 'square' | undefined;
    /** Consumer-controlled toggle selection. Ignored for default and text buttons. */
    selected?: boolean | undefined;
    /** Link browsing-context target. */
    target?: string | undefined;
    /** Link relationship tokens. */
    rel?: string | undefined;
    /** Form value used by submit Buttons. */
    value?: string | null | undefined;
  }>(),
  {
    color: 'filled',
    nativeType: 'button',
    variant: 'default',
    size: 'small',
    shape: 'round',
  },
);

const emit = defineEmits<{
  /** Stable action event normalized from the renderer host click. */
  click: [event: MouseEvent];
  /** Controlled toggle intent; the parent remains the selected-state owner. */
  'update:selected': [selected: boolean];
}>();

const slots = defineSlots<{
  /** Leading icon content. */
  icon(): unknown;
  /** Label content rendered while a toggle Button is selected. */
  selected(): unknown;
  /** Leading icon rendered while a toggle Button is selected. */
  'selected-icon'(): unknown;
  /** Trailing icon content. */
  'trailing-icon'(): unknown;
}>();

const MDButtonSlottedContent = defineComponent({
  name: 'MDButtonSlottedContent',
  props: {
    slotName: {
      type: String,
      required: true,
    },
  },
  setup(slotProps, { slots: contentSlots }) {
    return () => h('span', { slot: slotProps.slotName }, contentSlots.default?.());
  },
});

const isLoading = computed(() => props.loading !== undefined && props.loading !== false);
const isUnsupportedTextToggle = computed(
  () => props.color === 'text' && props.variant === 'toggle',
);
const isToggle = computed(() => props.variant === 'toggle' && !isUnsupportedTextToggle.value);
const appliedSelected = computed(() => isToggle.value && !!props.selected);
const rendererVariant = computed<RendererButtonVariant>(() => props.color);
const rendererSize = computed<RendererButtonSize>(() => props.size);
const rendererShape = computed<RendererButtonShape>(() =>
  props.shape === 'round' ? 'rounded' : 'square',
);
const rendererType = computed<M3eButtonElement['type']>(() => props.nativeType);
const rendererDownload = computed<M3eButtonElement['download'] | undefined>(() => props.download);
const rendererHref = computed<M3eButtonElement['href'] | undefined>(() => props.href);
const rendererName = computed<M3eButtonElement['name'] | undefined>(() => props.name);
const rendererRel = computed<M3eButtonElement['rel'] | undefined>(() => props.rel);
const rendererTarget = computed<M3eButtonElement['target'] | undefined>(() => props.target);
const rendererValue = computed<M3eButtonElement['value'] | undefined>(() => props.value);

const onBeforeInput = (event: InputEvent) => {
  if (!isToggle.value) return;

  event.preventDefault();
  emit('update:selected', !appliedSelected.value);
};

const onClick = (event: MouseEvent) => {
  emit('click', event);
};

if (import.meta.env.DEV) {
  onMounted(() => {
    watchEffect(() => {
      if (isUnsupportedTextToggle.value) {
        warn(
          'MDButton: `color="text"` does not support `variant="toggle"` — rendering as a default action.',
        );
      } else if (props.selected && !isToggle.value) {
        warn('MDButton: `selected` has no effect unless `variant` is "toggle".');
      }
    });
  });
}
</script>

<template>
  <!-- eslint-disable vue/attribute-hyphenation -- The m3e Boolean must be bound as a camel-case property; its dashed attribute would treat false as present. -->
  <m3e-button
    class="md-button"
    :aria-busy="isLoading ? 'true' : undefined"
    :disabled="props.disabled"
    :disabledInteractive="props.disabledInteractive"
    :download="rendererDownload"
    :href="rendererHref"
    :name="rendererName"
    :rel="rendererRel"
    :selected="appliedSelected"
    :shape="rendererShape"
    :size="rendererSize"
    :toggle="isToggle"
    :target="rendererTarget"
    :type="rendererType"
    :value="rendererValue"
    :variant="rendererVariant"
    @beforeinput="onBeforeInput"
    @click.stop="onClick"
  >
    <MDButtonSlottedContent
      v-if="!!slots.icon"
      class="md-button__icon"
      :class="{ 'md-button__content_loading': isLoading }"
      slot-name="icon"
    >
      <slot name="icon" />
    </MDButtonSlottedContent>
    <MDButtonSlottedContent
      v-if="!!slots['selected-icon']"
      class="md-button__icon"
      :class="{ 'md-button__content_loading': isLoading }"
      slot-name="selected-icon"
    >
      <slot name="selected-icon" />
    </MDButtonSlottedContent>
    <span class="md-button__label-text" :class="{ 'md-button__content_loading': isLoading }">{{
      props.label
    }}</span>
    <MDButtonSlottedContent
      v-if="!!slots.selected"
      class="md-button__label-text"
      :class="{ 'md-button__content_loading': isLoading }"
      slot-name="selected"
    >
      <slot name="selected" />
    </MDButtonSlottedContent>
    <MDButtonSlottedContent
      v-if="!!slots['trailing-icon']"
      class="md-button__icon"
      :class="{ 'md-button__content_loading': isLoading }"
      slot-name="trailing-icon"
    >
      <slot name="trailing-icon" />
    </MDButtonSlottedContent>
    <MDCircularProgressIndicator
      v-if="isLoading"
      class="md-button__progress-indicator md-button__progress-indicator_centered"
      :progress="isNumber(props.loading) ? props.loading : undefined"
      :size="24"
    />
  </m3e-button>
  <!-- eslint-enable vue/attribute-hyphenation -->
</template>

<style scoped>
.md-button {
  vertical-align: middle;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.md-button[disabled] {
  cursor: default;
}

.md-button__icon {
  display: inline-flex;
  color: inherit;
}

.md-button__content_loading {
  opacity: 0;
}

.md-button__progress-indicator {
  display: inline-flex;
  --md-circular-progress-color: var(--md-private-button-loading-indicator-color);
}

.md-button__progress-indicator_centered {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
}

.md-button[variant='elevated'] {
  --md-private-button-loading-indicator-color: var(
    --md-comp-button-elevated-label-text-color,
    var(--md-sys-color-primary)
  );
}

.md-button[variant='filled'] {
  --md-private-button-loading-indicator-color: var(
    --md-comp-button-filled-label-text-color,
    var(--md-sys-color-on-primary)
  );
}

.md-button[variant='tonal'] {
  --md-private-button-loading-indicator-color: var(
    --md-comp-button-tonal-label-text-color,
    var(--md-sys-color-on-secondary-container)
  );
}

.md-button[variant='outlined'] {
  --md-private-button-loading-indicator-color: var(
    --md-comp-button-outlined-label-text-color,
    var(--md-sys-color-primary)
  );
}

.md-button[variant='text'] {
  --md-private-button-loading-indicator-color: var(
    --md-comp-button-text-label-text-color,
    var(--md-sys-color-primary)
  );
}
</style>
