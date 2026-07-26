<script setup lang="ts">
import { computed } from 'vue';
import { isNumber } from 'es-toolkit/compat';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { MDButton } from '@shared/ui/material';

const props = withDefaults(
  defineProps<{
    /** Visible label and accessible name. */
    label: string;
    /** Shows indeterminate progress for `true` or determinate progress for a number. */
    loading?: boolean | number | undefined;
    /** Material Button color configuration. */
    color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | undefined;
    /** Native button type. */
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    /** Disables the underlying action. */
    disabled?: boolean | undefined;
    /** Material Button size. */
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    /** Material Button shape. */
    shape?: 'round' | 'square' | undefined;
  }>(),
  { color: 'filled', nativeType: 'button', size: 'small', shape: 'round' },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const slots = defineSlots<{ icon(): unknown }>();

const isLoading = computed(() => props.loading !== undefined && props.loading !== false);
const progress = computed(() => (isNumber(props.loading) ? props.loading : undefined));

const onClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <span
    class="loading-button"
    :class="`loading-button_color_${props.color}`"
    :aria-busy="isLoading ? 'true' : undefined"
  >
    <MDButton
      :color="props.color"
      :disabled="props.disabled"
      :label="props.label"
      :native-type="props.nativeType"
      :shape="props.shape"
      :size="props.size"
      @click="onClick"
    >
      <template v-if="isLoading || !!slots.icon" #icon>
        <MDCircularProgressIndicator
          v-if="isLoading"
          class="loading-button__progress-indicator"
          :progress="progress"
          :size="20"
        />
        <slot v-else name="icon" />
      </template>
    </MDButton>
  </span>
</template>

<style scoped>
.loading-button {
  display: inline-flex;
  vertical-align: middle;
}

.loading-button__progress-indicator {
  display: inline-flex;
  --md-circular-progress-color: var(--md-private-loading-button-progress-color);
}

.loading-button_color_elevated,
.loading-button_color_outlined,
.loading-button_color_text {
  --md-private-loading-button-progress-color: var(--md-sys-color-primary);
}

.loading-button_color_filled {
  --md-private-loading-button-progress-color: var(--md-sys-color-on-primary);
}

.loading-button_color_tonal {
  --md-private-loading-button-progress-color: var(--md-sys-color-on-secondary-container);
}
</style>
