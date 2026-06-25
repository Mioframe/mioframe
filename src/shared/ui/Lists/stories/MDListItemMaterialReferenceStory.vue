<script setup lang="ts">
import MDSymbol from '../../Icon/MDSymbol.vue';
import { MDStateLayerForcedStateProvider } from '../../State/testing';
import { MDList, MDListItem } from '@shared/ui/Lists';

const onAction = () => {};
</script>

<template>
  <div class="md-list-item-material-reference-story">
    <div
      data-testid="visual-md-list-material-states"
      class="visual-list-backdrop md-list-item-material-reference-story__group"
    >
      <MDList class="md-list-item-material-reference-story__list">
        <MDListItem mode="single-action" label-text="Default" @action="onAction">
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
        <MDStateLayerForcedStateProvider hovered>
          <MDListItem
            class="md-state_hover"
            mode="single-action"
            label-text="Hover"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="draft" />
            </template>
          </MDListItem>
        </MDStateLayerForcedStateProvider>
        <MDStateLayerForcedStateProvider focused>
          <MDListItem
            class="md-state_focused"
            mode="single-action"
            label-text="Focus"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="draft" />
            </template>
          </MDListItem>
        </MDStateLayerForcedStateProvider>
        <MDStateLayerForcedStateProvider pressed>
          <MDListItem
            class="md-state_pressed"
            mode="single-action"
            label-text="Pressed"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="draft" />
            </template>
          </MDListItem>
        </MDStateLayerForcedStateProvider>
        <MDStateLayerForcedStateProvider dragged>
          <MDListItem
            class="md-state_dragged"
            mode="single-action"
            label-text="Dragged"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="draft" />
            </template>
          </MDListItem>
        </MDStateLayerForcedStateProvider>
        <MDListItem mode="single-action" disabled label-text="Disabled" @action="onAction">
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
      </MDList>
    </div>

    <div
      data-testid="visual-md-list-material-standard"
      class="visual-list-backdrop md-list-item-material-reference-story__group"
    >
      <MDList class="md-list-item-material-reference-story__list">
        <MDListItem mode="single-action" label-text="List item" @action="onAction">
          <template #leading>
            <MDSymbol name="draft" />
          </template>
          <template #trailing>
            <span class="md-list-item-material-reference-story__trailing-text">100</span>
          </template>
        </MDListItem>
        <MDListItem
          mode="single-action"
          label-text="List item"
          supporting-text="Supporting text"
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="draft" />
          </template>
          <template #trailing>
            <MDSymbol name="star" />
          </template>
        </MDListItem>
        <MDListItem mode="single-action" label-text="List item" disabled>
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
      </MDList>
    </div>

    <div
      data-testid="visual-md-list-material-segmented"
      class="visual-list-backdrop md-list-item-material-reference-story__group"
    >
      <MDList list-style="segmented" class="md-list-item-material-reference-story__list">
        <MDListItem mode="single-action" label-text="List item" @action="onAction">
          <template #leading>
            <MDSymbol name="draft" />
          </template>
          <template #trailing>
            <span class="md-list-item-material-reference-story__trailing-text">100</span>
          </template>
        </MDListItem>
        <MDListItem
          mode="single-action"
          label-text="List item"
          supporting-text="Supporting text"
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="draft" />
          </template>
          <template #trailing>
            <MDSymbol name="star" />
          </template>
        </MDListItem>
        <MDListItem mode="single-action" label-text="List item" disabled>
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
      </MDList>
    </div>

    <div
      data-testid="visual-md-list-material-configurations"
      class="visual-list-backdrop md-list-item-material-reference-story__group"
    >
      <MDList class="md-list-item-material-reference-story__list">
        <MDListItem label-text="List item" />
        <MDListItem label-text="List item" supporting-text="Supporting text" />
        <MDListItem leading-type="avatar" label-text="List item" supporting-text="Supporting text">
          <template #leading>
            <span class="md-list-item-material-reference-story__avatar">A</span>
          </template>
        </MDListItem>
        <MDListItem
          leading-type="media"
          overline="Overline"
          label-text="List item"
          supporting-text="Supporting text"
          :line-count="3"
        >
          <template #leading>
            <span class="md-list-item-material-reference-story__media" />
          </template>
        </MDListItem>
      </MDList>
    </div>
  </div>
</template>

<style scoped>
.md-list-item-material-reference-story {
  display: grid;
  gap: 24dp;
}

.md-list-item-material-reference-story__group {
  width: min(360dp, calc(100vw - 32dp));
  padding: 24dp;
}

.md-list-item-material-reference-story__list {
  width: 100%;
}

.md-list-item-material-reference-story__trailing-text {
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-material-reference-story__avatar {
  display: grid;
  place-items: center;
  width: 40dp;
  height: 40dp;
  border-radius: 20dp;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  font-family: var(--md-sys-typescale-label-medium-font);
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-label-medium-weight);
  line-height: var(--md-sys-typescale-label-medium-line-height);
  letter-spacing: var(--md-sys-typescale-label-medium-tracking);
}

.md-list-item-material-reference-story__media {
  display: block;
  width: 56dp;
  height: 56dp;
  border-radius: 8dp;
  background: var(--md-sys-color-tertiary-container);
}
</style>
