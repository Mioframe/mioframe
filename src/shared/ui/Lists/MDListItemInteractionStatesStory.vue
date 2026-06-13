<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-interaction-states-story">
    <p class="md-list-item-interaction-states-story__section">Single-action</p>

    <MDListItem
      mode="single-action"
      label-text="Enabled"
      supporting-text="Baseline — no state layer"
    />
    <MDListItem
      mode="single-action"
      class="md-state_hover"
      label-text="Hover"
      supporting-text="State layer covers full item surface"
    />
    <MDListItem
      mode="single-action"
      class="md-state_focused"
      label-text="Focus"
      supporting-text="State layer covers full item surface"
    />
    <MDListItem
      mode="single-action"
      class="md-state_pressed"
      label-text="Pressed"
      supporting-text="State layer covers full item surface"
    />
    <MDListItem
      mode="single-action"
      class="md-state_dragged"
      label-text="Dragged"
      supporting-text="State layer covers full item surface"
      draggable
    />
    <MDListItem
      mode="single-action"
      label-text="Disabled"
      supporting-text="No state layer"
      disabled
    />

    <p class="md-list-item-interaction-states-story__section">
      Multi-action — primary action surface
    </p>

    <MDListItem
      mode="multi-action"
      label-text="Enabled"
      supporting-text="No state layer on primary action"
      @action="onAction"
    >
      <template #trailingAction>
        <button type="button" class="md-list-item-interaction-states-story__secondary-btn">
          ⋮
        </button>
      </template>
    </MDListItem>
    <MDListItem
      ref="multiActionHoverRef"
      mode="multi-action"
      label-text="Hover (primary only)"
      supporting-text="State layer covers primary action area; secondary target is unaffected"
      @action="onAction"
    >
      <template #trailingAction>
        <button type="button" class="md-list-item-interaction-states-story__secondary-btn">
          ⋮
        </button>
      </template>
    </MDListItem>
  </div>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-item-interaction-states',
};

const onAction = () => {};

const multiActionHoverRef = useTemplateRef<InstanceType<typeof MDListItem>>('multiActionHoverRef');

onMounted(() => {
  const el = multiActionHoverRef.value?.$el;
  if (!(el instanceof HTMLElement)) return;
  // Inject md-state_hover onto the primary-action element so the state layer
  // (its direct child) activates via the :global(.md-state_hover) > & CSS rule,
  // demonstrating that hover coverage is bounded to the primary action surface.
  el.querySelector<HTMLElement>('.md-list-item__primary-action')?.classList.add('md-state_hover');
});
</script>

<style scoped>
.md-list-item-interaction-states-story {
  width: 360px;
  /*
   * Use primary as the state-layer color so state-layer overlays are clearly
   * visible at Material spec opacities in a screenshot.
   * In production, --md-content-color inherits from the global on-surface token.
   */
  --md-content-color: var(--md-sys-color-primary);
}

.md-list-item-interaction-states-story__section {
  margin: 8px 16px 2px;
  font-family: var(--md-sys-typescale-label-small-font);
  font-size: var(--md-sys-typescale-label-small-size);
  font-weight: var(--md-sys-typescale-label-small-weight);
  line-height: var(--md-sys-typescale-label-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-list-item-interaction-states-story__secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 20px;
}
</style>
