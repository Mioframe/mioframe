<script setup lang="ts">
import '@m3e/web/fab';
import type { FabVariant as RendererFabVariant } from '@m3e/web/fab';
// This adapter uses an explicit, family-scoped host-attribute allow-list below.
// eslint-disable-next-line no-restricted-imports -- the adapter is the documented transparent host boundary.
import { computed, useAttrs } from 'vue';
import {
  mdExtendedFloatingActionButtonDefaults,
  type MDExtendedFloatingActionButtonEmits,
  type MDExtendedFloatingActionButtonProps,
  type MDExtendedFloatingActionButtonSlots,
} from './contract';
import './tokens.css';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<MDExtendedFloatingActionButtonProps>(),
  mdExtendedFloatingActionButtonDefaults,
);

const emit = defineEmits<MDExtendedFloatingActionButtonEmits>();

defineSlots<MDExtendedFloatingActionButtonSlots>();

const labelSlot = { slot: 'label' };

const attrs = useAttrs();

/**
 * Normalizes the renderer host's native activation into the canonical typed
 * `click` component event, forwarding the originating `MouseEvent` unchanged.
 * @param event - The native activation event dispatched by the renderer host.
 */
const onClick = (event: MouseEvent) => {
  emit('click', event);
};

const rendererVariant = computed<RendererFabVariant>(() => props.color);

/**
 * Selects the component-library modifier class that carries the private
 * `@m3e/web` renderer token bridge for the current color mapping's
 * non-namespaced elevation/focus-ring inputs (see the `<style>` block below).
 * The bridge itself — every `--m3e-*` custom-property name and its
 * `--md-comp-*` source — stays declared in CSS; this only chooses which
 * static class applies.
 */
const colorClass = computed(() => `md-extended-floating-action-button_color_${props.color}`);

/**
 * Returns the narrow set of host attributes that do not alter the canonical
 * Extended FAB action, state, or renderer configuration. Native activation is
 * exposed through the typed `click` component event (see `onClick`) rather
 * than through allow-listed attribute forwarding.
 * @returns The allow-listed subset of the current host attributes.
 */
const getForwardedAttrs = (): Record<string, unknown> => {
  const forwarded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'id' || key === 'title') {
      forwarded[key] = value;
    } else if (key.startsWith('data-')) {
      forwarded[key] = value;
    }
  }
  return forwarded;
};
</script>

<template>
  <!--
    BEHAVIOR.md requires the extended FAB surface to expand using an enter transition when it
    first appears; the installed renderer does not implement any appear motion (it only
    transitions background/label/icon color — see fab.js `FabStyle`), so this family-local
    `Transition appear` is the small adapter-owned seam that supplies it without recreating any
    renderer-owned state layer, ripple, focus, elevation, or geometry system.
  -->
  <Transition appear name="md-extended-floating-action-button-appear">
    <!-- eslint-disable-next-line vue/no-undef-components -- m3e-fab is registered by the private Material renderer declaration. -->
    <m3e-fab
      v-bind="getForwardedAttrs()"
      :class="[
        'md-extended-floating-action-button',
        `md-extended-floating-action-button_size_${props.size}`,
        colorClass,
        attrs.class,
      ]"
      :style="attrs.style"
      :extended="true"
      :size="props.size"
      :variant="rendererVariant"
      @click="onClick"
    >
      <slot name="icon" />
      <span v-bind="labelSlot" class="md-extended-floating-action-button__label"><slot /></span>
    </m3e-fab>
  </Transition>
</template>

<style scoped>
.md-extended-floating-action-button {
  vertical-align: middle;
}

/*
 * BEHAVIOR.md "Motion": the extended FAB surface expands using an enter transition when it
 * first appears on screen. Material does not prescribe an exact duration or easing for this
 * transition, so this reuses the foundation's existing "expressive fast-spatial" motion tokens
 * (docs/component-adapter.md "small family-local adapter mapping/correction"; the renderer
 * itself uses the same spring-derived tokens for its own with-menu expand transition — see
 * fab.js `DesignToken.motion.spring.fastSpatial`). Prefers-reduced-motion disables the
 * transition, matching the renderer's own `@media (prefers-reduced-motion)` handling of its
 * color/elevation transitions.
 */
.md-extended-floating-action-button-appear-enter-active {
  transition:
    opacity var(--md-private-motion-expressive-fast-spatial-duration)
      var(--md-private-motion-expressive-fast-spatial-easing),
    transform var(--md-private-motion-expressive-fast-spatial-duration)
      var(--md-private-motion-expressive-fast-spatial-easing);
}

.md-extended-floating-action-button-appear-enter-from {
  opacity: 0;
  transform: scale(0.6);
}

@media (prefers-reduced-motion: reduce) {
  .md-extended-floating-action-button-appear-enter-active {
    transition: none;
  }
}

.md-extended-floating-action-button__label {
  white-space: nowrap;
}

.md-extended-floating-action-button_size_small .md-extended-floating-action-button__label {
  font-family: var(--md-sys-typescale-title-medium-font);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  letter-spacing: var(--md-sys-typescale-title-medium-tracking);
  font: var(--md-comp-extended-fab-small-label-text);
}

.md-extended-floating-action-button_size_medium .md-extended-floating-action-button__label {
  font-family: var(--md-sys-typescale-title-large-font);
  font-size: var(--md-sys-typescale-title-large-size);
  font-weight: var(--md-sys-typescale-title-large-weight);
  line-height: var(--md-sys-typescale-title-large-line-height);
  letter-spacing: var(--md-sys-typescale-title-large-tracking);
  font: var(--md-comp-extended-fab-medium-label-text);
}

.md-extended-floating-action-button_size_large .md-extended-floating-action-button__label {
  font-family: var(--md-sys-typescale-headline-small-font);
  font-size: var(--md-sys-typescale-headline-small-size);
  font-weight: var(--md-sys-typescale-headline-small-weight);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  letter-spacing: var(--md-sys-typescale-headline-small-tracking);
  font: var(--md-comp-extended-fab-large-label-text);
}

/*
 * Private @m3e/web renderer token bridge (docs/component-tokens.md "Private renderer
 * mapping"; owning component CSS, kept out of the public tokens.css catalogue). The
 * installed `@m3e/web@2.7.4` `<m3e-fab>` element namespaces its per-size and
 * per-variant container/state private custom properties as `--m3e-fab-<size>-*`
 * and `--m3e-<variant>-fab-*`, so every current size and color configuration can be
 * bridged unconditionally here: the renderer only reads the namespace that matches
 * its own `size`/`variant` renderer inputs, which this adapter selects through those
 * documented properties in the template, not through this CSS.
 */
.md-extended-floating-action-button {
  --m3e-fab-small-container-height: var(--md-comp-extended-fab-small-container-height);
  --m3e-fab-small-icon-size: var(--md-comp-extended-fab-small-icon-size);
  --m3e-fab-small-shape: var(--md-comp-extended-fab-small-container-shape);
  --m3e-fab-small-leading-space: var(--md-comp-extended-fab-small-leading-space);
  --m3e-fab-small-icon-label-space: var(--md-comp-extended-fab-small-icon-label-space);
  --m3e-fab-small-trailing-space: var(--md-comp-extended-fab-small-trailing-space);

  --m3e-fab-medium-container-height: var(--md-comp-extended-fab-medium-container-height);
  --m3e-fab-medium-icon-size: var(--md-comp-extended-fab-medium-icon-size);
  --m3e-fab-medium-shape: var(--md-comp-extended-fab-medium-container-shape);
  --m3e-fab-medium-leading-space: var(--md-comp-extended-fab-medium-leading-space);
  --m3e-fab-medium-icon-label-space: var(--md-comp-extended-fab-medium-icon-label-space);
  --m3e-fab-medium-trailing-space: var(--md-comp-extended-fab-medium-trailing-space);

  --m3e-fab-large-container-height: var(--md-comp-extended-fab-large-container-height);
  --m3e-fab-large-icon-size: var(--md-comp-extended-fab-large-icon-size);
  --m3e-fab-large-shape: var(--md-comp-extended-fab-large-container-shape);
  --m3e-fab-large-leading-space: var(--md-comp-extended-fab-large-leading-space);
  --m3e-fab-large-icon-label-space: var(--md-comp-extended-fab-large-icon-label-space);
  --m3e-fab-large-trailing-space: var(--md-comp-extended-fab-large-trailing-space);

  --m3e-primary-fab-container-color: var(--md-comp-extended-fab-primary-container-color);
  --m3e-primary-fab-container-elevation: var(--md-comp-extended-fab-primary-container-elevation);
  --m3e-primary-fab-label-text-color: var(--md-comp-extended-fab-primary-label-text-color);
  --m3e-primary-fab-icon-color: var(--md-comp-extended-fab-primary-icon-color);
  --m3e-primary-fab-hover-container-elevation: var(
    --md-comp-extended-fab-primary-hovered-container-elevation
  );
  --m3e-primary-fab-hover-state-layer-color: var(
    --md-comp-extended-fab-primary-hovered-state-layer-color
  );
  --m3e-primary-fab-hover-state-layer-opacity: var(
    --md-comp-extended-fab-primary-hovered-state-layer-opacity
  );
  --m3e-primary-fab-hover-label-text-color: var(
    --md-comp-extended-fab-primary-hovered-label-text-color
  );
  --m3e-primary-fab-hover-icon-color: var(--md-comp-extended-fab-primary-hovered-icon-color);
  --m3e-primary-fab-focus-container-elevation: var(
    --md-comp-extended-fab-primary-focused-container-elevation
  );
  --m3e-primary-fab-focus-state-layer-color: var(
    --md-comp-extended-fab-primary-focused-state-layer-color
  );
  --m3e-primary-fab-focus-state-layer-opacity: var(
    --md-comp-extended-fab-primary-focused-state-layer-opacity
  );
  --m3e-primary-fab-focus-label-text-color: var(
    --md-comp-extended-fab-primary-focused-label-text-color
  );
  --m3e-primary-fab-focus-icon-color: var(--md-comp-extended-fab-primary-focused-icon-color);
  --m3e-primary-fab-pressed-container-elevation: var(
    --md-comp-extended-fab-primary-pressed-container-elevation
  );
  --m3e-primary-fab-pressed-state-layer-color: var(
    --md-comp-extended-fab-primary-pressed-state-layer-color
  );
  --m3e-primary-fab-pressed-state-layer-opacity: var(
    --md-comp-extended-fab-primary-pressed-state-layer-opacity
  );
  --m3e-primary-fab-pressed-label-text-color: var(
    --md-comp-extended-fab-primary-pressed-label-text-color
  );
  --m3e-primary-fab-pressed-icon-color: var(--md-comp-extended-fab-primary-pressed-icon-color);

  --m3e-secondary-fab-container-color: var(--md-comp-extended-fab-secondary-container-color);
  --m3e-secondary-fab-container-elevation: var(
    --md-comp-extended-fab-secondary-container-elevation
  );
  --m3e-secondary-fab-label-text-color: var(--md-comp-extended-fab-secondary-label-text-color);
  --m3e-secondary-fab-icon-color: var(--md-comp-extended-fab-secondary-icon-color);
  --m3e-secondary-fab-hover-container-elevation: var(
    --md-comp-extended-fab-secondary-hovered-container-elevation
  );
  --m3e-secondary-fab-hover-state-layer-color: var(
    --md-comp-extended-fab-secondary-hovered-state-layer-color
  );
  --m3e-secondary-fab-hover-state-layer-opacity: var(
    --md-comp-extended-fab-secondary-hovered-state-layer-opacity
  );
  --m3e-secondary-fab-hover-label-text-color: var(
    --md-comp-extended-fab-secondary-hovered-label-text-color
  );
  --m3e-secondary-fab-hover-icon-color: var(--md-comp-extended-fab-secondary-hovered-icon-color);
  --m3e-secondary-fab-focus-container-elevation: var(
    --md-comp-extended-fab-secondary-focused-container-elevation
  );
  --m3e-secondary-fab-focus-state-layer-color: var(
    --md-comp-extended-fab-secondary-focused-state-layer-color
  );
  --m3e-secondary-fab-focus-state-layer-opacity: var(
    --md-comp-extended-fab-secondary-focused-state-layer-opacity
  );
  --m3e-secondary-fab-focus-label-text-color: var(
    --md-comp-extended-fab-secondary-focused-label-text-color
  );
  --m3e-secondary-fab-focus-icon-color: var(--md-comp-extended-fab-secondary-focused-icon-color);
  --m3e-secondary-fab-pressed-container-elevation: var(
    --md-comp-extended-fab-secondary-pressed-container-elevation
  );
  --m3e-secondary-fab-pressed-state-layer-color: var(
    --md-comp-extended-fab-secondary-pressed-state-layer-color
  );
  --m3e-secondary-fab-pressed-state-layer-opacity: var(
    --md-comp-extended-fab-secondary-pressed-state-layer-opacity
  );
  --m3e-secondary-fab-pressed-label-text-color: var(
    --md-comp-extended-fab-secondary-pressed-label-text-color
  );
  --m3e-secondary-fab-pressed-icon-color: var(--md-comp-extended-fab-secondary-pressed-icon-color);

  --m3e-tertiary-fab-container-color: var(--md-comp-extended-fab-tertiary-container-color);
  --m3e-tertiary-fab-container-elevation: var(--md-comp-extended-fab-tertiary-container-elevation);
  --m3e-tertiary-fab-label-text-color: var(--md-comp-extended-fab-tertiary-label-text-color);
  --m3e-tertiary-fab-icon-color: var(--md-comp-extended-fab-tertiary-icon-color);
  --m3e-tertiary-fab-hover-container-elevation: var(
    --md-comp-extended-fab-tertiary-hovered-container-elevation
  );
  --m3e-tertiary-fab-hover-state-layer-color: var(
    --md-comp-extended-fab-tertiary-hovered-state-layer-color
  );
  --m3e-tertiary-fab-hover-state-layer-opacity: var(
    --md-comp-extended-fab-tertiary-hovered-state-layer-opacity
  );
  --m3e-tertiary-fab-hover-label-text-color: var(
    --md-comp-extended-fab-tertiary-hovered-label-text-color
  );
  --m3e-tertiary-fab-hover-icon-color: var(--md-comp-extended-fab-tertiary-hovered-icon-color);
  --m3e-tertiary-fab-focus-container-elevation: var(
    --md-comp-extended-fab-tertiary-focused-container-elevation
  );
  --m3e-tertiary-fab-focus-state-layer-color: var(
    --md-comp-extended-fab-tertiary-focused-state-layer-color
  );
  --m3e-tertiary-fab-focus-state-layer-opacity: var(
    --md-comp-extended-fab-tertiary-focused-state-layer-opacity
  );
  --m3e-tertiary-fab-focus-label-text-color: var(
    --md-comp-extended-fab-tertiary-focused-label-text-color
  );
  --m3e-tertiary-fab-focus-icon-color: var(--md-comp-extended-fab-tertiary-focused-icon-color);
  --m3e-tertiary-fab-pressed-container-elevation: var(
    --md-comp-extended-fab-tertiary-pressed-container-elevation
  );
  --m3e-tertiary-fab-pressed-state-layer-color: var(
    --md-comp-extended-fab-tertiary-pressed-state-layer-color
  );
  --m3e-tertiary-fab-pressed-state-layer-opacity: var(
    --md-comp-extended-fab-tertiary-pressed-state-layer-opacity
  );
  --m3e-tertiary-fab-pressed-label-text-color: var(
    --md-comp-extended-fab-tertiary-pressed-label-text-color
  );
  --m3e-tertiary-fab-pressed-icon-color: var(--md-comp-extended-fab-tertiary-pressed-icon-color);

  --m3e-primary-container-fab-container-color: var(
    --md-comp-extended-fab-primary-container-container-color
  );
  --m3e-primary-container-fab-container-elevation: var(
    --md-comp-extended-fab-primary-container-container-elevation
  );
  --m3e-primary-container-fab-label-text-color: var(
    --md-comp-extended-fab-primary-container-label-text-color
  );
  --m3e-primary-container-fab-icon-color: var(--md-comp-extended-fab-primary-container-icon-color);
  --m3e-primary-container-fab-hover-container-elevation: var(
    --md-comp-extended-fab-primary-container-hovered-container-elevation
  );
  --m3e-primary-container-fab-hover-state-layer-color: var(
    --md-comp-extended-fab-primary-container-hovered-state-layer-color
  );
  --m3e-primary-container-fab-hover-state-layer-opacity: var(
    --md-comp-extended-fab-primary-container-hovered-state-layer-opacity
  );
  --m3e-primary-container-fab-hover-label-text-color: var(
    --md-comp-extended-fab-primary-container-hovered-label-text-color
  );
  --m3e-primary-container-fab-hover-icon-color: var(
    --md-comp-extended-fab-primary-container-hovered-icon-color
  );
  --m3e-primary-container-fab-focus-container-elevation: var(
    --md-comp-extended-fab-primary-container-focused-container-elevation
  );
  --m3e-primary-container-fab-focus-state-layer-color: var(
    --md-comp-extended-fab-primary-container-focused-state-layer-color
  );
  --m3e-primary-container-fab-focus-state-layer-opacity: var(
    --md-comp-extended-fab-primary-container-focused-state-layer-opacity
  );
  --m3e-primary-container-fab-focus-label-text-color: var(
    --md-comp-extended-fab-primary-container-focused-label-text-color
  );
  --m3e-primary-container-fab-focus-icon-color: var(
    --md-comp-extended-fab-primary-container-focused-icon-color
  );
  --m3e-primary-container-fab-pressed-container-elevation: var(
    --md-comp-extended-fab-primary-container-pressed-container-elevation
  );
  --m3e-primary-container-fab-pressed-state-layer-color: var(
    --md-comp-extended-fab-primary-container-pressed-state-layer-color
  );
  --m3e-primary-container-fab-pressed-state-layer-opacity: var(
    --md-comp-extended-fab-primary-container-pressed-state-layer-opacity
  );
  --m3e-primary-container-fab-pressed-label-text-color: var(
    --md-comp-extended-fab-primary-container-pressed-label-text-color
  );
  --m3e-primary-container-fab-pressed-icon-color: var(
    --md-comp-extended-fab-primary-container-pressed-icon-color
  );

  --m3e-secondary-container-fab-container-color: var(
    --md-comp-extended-fab-secondary-container-container-color
  );
  --m3e-secondary-container-fab-container-elevation: var(
    --md-comp-extended-fab-secondary-container-container-elevation
  );
  --m3e-secondary-container-fab-label-text-color: var(
    --md-comp-extended-fab-secondary-container-label-text-color
  );
  --m3e-secondary-container-fab-icon-color: var(
    --md-comp-extended-fab-secondary-container-icon-color
  );
  --m3e-secondary-container-fab-hover-container-elevation: var(
    --md-comp-extended-fab-secondary-container-hovered-container-elevation
  );
  --m3e-secondary-container-fab-hover-state-layer-color: var(
    --md-comp-extended-fab-secondary-container-hovered-state-layer-color
  );
  --m3e-secondary-container-fab-hover-state-layer-opacity: var(
    --md-comp-extended-fab-secondary-container-hovered-state-layer-opacity
  );
  --m3e-secondary-container-fab-hover-label-text-color: var(
    --md-comp-extended-fab-secondary-container-hovered-label-text-color
  );
  --m3e-secondary-container-fab-hover-icon-color: var(
    --md-comp-extended-fab-secondary-container-hovered-icon-color
  );
  --m3e-secondary-container-fab-focus-container-elevation: var(
    --md-comp-extended-fab-secondary-container-focused-container-elevation
  );
  --m3e-secondary-container-fab-focus-state-layer-color: var(
    --md-comp-extended-fab-secondary-container-focused-state-layer-color
  );
  --m3e-secondary-container-fab-focus-state-layer-opacity: var(
    --md-comp-extended-fab-secondary-container-focused-state-layer-opacity
  );
  --m3e-secondary-container-fab-focus-label-text-color: var(
    --md-comp-extended-fab-secondary-container-focused-label-text-color
  );
  --m3e-secondary-container-fab-focus-icon-color: var(
    --md-comp-extended-fab-secondary-container-focused-icon-color
  );
  --m3e-secondary-container-fab-pressed-container-elevation: var(
    --md-comp-extended-fab-secondary-container-pressed-container-elevation
  );
  --m3e-secondary-container-fab-pressed-state-layer-color: var(
    --md-comp-extended-fab-secondary-container-pressed-state-layer-color
  );
  --m3e-secondary-container-fab-pressed-state-layer-opacity: var(
    --md-comp-extended-fab-secondary-container-pressed-state-layer-opacity
  );
  --m3e-secondary-container-fab-pressed-label-text-color: var(
    --md-comp-extended-fab-secondary-container-pressed-label-text-color
  );
  --m3e-secondary-container-fab-pressed-icon-color: var(
    --md-comp-extended-fab-secondary-container-pressed-icon-color
  );

  --m3e-tertiary-container-fab-container-color: var(
    --md-comp-extended-fab-tertiary-container-container-color
  );
  --m3e-tertiary-container-fab-container-elevation: var(
    --md-comp-extended-fab-tertiary-container-container-elevation
  );
  --m3e-tertiary-container-fab-label-text-color: var(
    --md-comp-extended-fab-tertiary-container-label-text-color
  );
  --m3e-tertiary-container-fab-icon-color: var(
    --md-comp-extended-fab-tertiary-container-icon-color
  );
  --m3e-tertiary-container-fab-hover-container-elevation: var(
    --md-comp-extended-fab-tertiary-container-hovered-container-elevation
  );
  --m3e-tertiary-container-fab-hover-state-layer-color: var(
    --md-comp-extended-fab-tertiary-container-hovered-state-layer-color
  );
  --m3e-tertiary-container-fab-hover-state-layer-opacity: var(
    --md-comp-extended-fab-tertiary-container-hovered-state-layer-opacity
  );
  --m3e-tertiary-container-fab-hover-label-text-color: var(
    --md-comp-extended-fab-tertiary-container-hovered-label-text-color
  );
  --m3e-tertiary-container-fab-hover-icon-color: var(
    --md-comp-extended-fab-tertiary-container-hovered-icon-color
  );
  --m3e-tertiary-container-fab-focus-container-elevation: var(
    --md-comp-extended-fab-tertiary-container-focused-container-elevation
  );
  --m3e-tertiary-container-fab-focus-state-layer-color: var(
    --md-comp-extended-fab-tertiary-container-focused-state-layer-color
  );
  --m3e-tertiary-container-fab-focus-state-layer-opacity: var(
    --md-comp-extended-fab-tertiary-container-focused-state-layer-opacity
  );
  --m3e-tertiary-container-fab-focus-label-text-color: var(
    --md-comp-extended-fab-tertiary-container-focused-label-text-color
  );
  --m3e-tertiary-container-fab-focus-icon-color: var(
    --md-comp-extended-fab-tertiary-container-focused-icon-color
  );
  --m3e-tertiary-container-fab-pressed-container-elevation: var(
    --md-comp-extended-fab-tertiary-container-pressed-container-elevation
  );
  --m3e-tertiary-container-fab-pressed-state-layer-color: var(
    --md-comp-extended-fab-tertiary-container-pressed-state-layer-color
  );
  --m3e-tertiary-container-fab-pressed-state-layer-opacity: var(
    --md-comp-extended-fab-tertiary-container-pressed-state-layer-opacity
  );
  --m3e-tertiary-container-fab-pressed-label-text-color: var(
    --md-comp-extended-fab-tertiary-container-pressed-label-text-color
  );
  --m3e-tertiary-container-fab-pressed-icon-color: var(
    --md-comp-extended-fab-tertiary-container-pressed-icon-color
  );
}

/*
 * `--m3e-elevation-color` and `--m3e-focus-ring-*` are generic, non-namespaced private
 * inputs shared through `@m3e/web/core` (unlike the `--m3e-<variant>-fab-*` bridge
 * above), so the correct public source token depends on which color mapping is
 * currently selected. Each reachable color gets its own component-library modifier
 * class (docs/component-tokens.md "renderer reuses one private token name across
 * multiple configurations"); `colorClass` applies the class matching the current
 * `color` prop.
 */
.md-extended-floating-action-button_color_primary {
  --m3e-elevation-color: var(--md-comp-extended-fab-primary-container-shadow-color);
  --m3e-focus-ring-color: var(--md-comp-extended-fab-primary-focus-indicator-color);
  --m3e-focus-ring-thickness: var(--md-comp-extended-fab-primary-focus-indicator-thickness);
  --m3e-focus-ring-outward-offset: var(
    --md-comp-extended-fab-primary-focus-indicator-outline-offset
  );
}

.md-extended-floating-action-button_color_secondary {
  --m3e-elevation-color: var(--md-comp-extended-fab-secondary-container-shadow-color);
  --m3e-focus-ring-color: var(--md-comp-extended-fab-secondary-focus-indicator-color);
  --m3e-focus-ring-thickness: var(--md-comp-extended-fab-secondary-focus-indicator-thickness);
  --m3e-focus-ring-outward-offset: var(
    --md-comp-extended-fab-secondary-focus-indicator-outline-offset
  );
}

.md-extended-floating-action-button_color_tertiary {
  --m3e-elevation-color: var(--md-comp-extended-fab-tertiary-container-shadow-color);
  --m3e-focus-ring-color: var(--md-comp-extended-fab-tertiary-focus-indicator-color);
  --m3e-focus-ring-thickness: var(--md-comp-extended-fab-tertiary-focus-indicator-thickness);
  --m3e-focus-ring-outward-offset: var(
    --md-comp-extended-fab-tertiary-focus-indicator-outline-offset
  );
}

.md-extended-floating-action-button_color_primary-container {
  --m3e-elevation-color: var(--md-comp-extended-fab-primary-container-container-shadow-color);
}

.md-extended-floating-action-button_color_secondary-container {
  --m3e-elevation-color: var(--md-comp-extended-fab-secondary-container-container-shadow-color);
}

.md-extended-floating-action-button_color_tertiary-container {
  --m3e-elevation-color: var(--md-comp-extended-fab-tertiary-container-container-shadow-color);
}
</style>
