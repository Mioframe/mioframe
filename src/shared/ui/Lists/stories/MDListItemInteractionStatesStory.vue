<script setup lang="ts">
import { ref } from 'vue';
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import { useFocusIndicator } from '../../State/useFocusIndicator';
import { MDStateLayerForcedStateProvider } from '../../State/testing';
import { MDList, MDListItem } from '@shared/ui/Lists';

const onAction = () => {};
const primaryActionCount = ref(0);
const trailingActionCount = ref(0);

const onPrimaryAction = () => {
  primaryActionCount.value += 1;
};

const onTrailingAction = () => {
  trailingActionCount.value += 1;
};

useFocusIndicator();
</script>

<template>
  <div
    data-testid="visual-md-list-interaction-states"
    class="visual-list-backdrop md-list-item-interaction-states-story"
  >
    <section class="md-list-item-interaction-states-story__section">
      <h3 class="md-list-item-interaction-states-story__title">Single-action surface</h3>
      <MDList>
        <MDStateLayerForcedStateProvider hovered>
          <MDListItem
            data-visual-state="hover"
            class="md-state_hover"
            mode="single-action"
            label-text="Hover"
            supporting-text="The state layer spans the row action surface"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="draft" />
            </template>
          </MDListItem>
        </MDStateLayerForcedStateProvider>
        <MDStateLayerForcedStateProvider focused>
          <MDListItem
            data-visual-state="focus"
            class="md-state_focused"
            mode="single-action"
            label-text="Focus"
            supporting-text="Focus stays inside the row action shape"
            @action="onAction"
          />
        </MDStateLayerForcedStateProvider>
        <MDStateLayerForcedStateProvider pressed>
          <MDListItem
            data-visual-state="pressed"
            class="md-state_pressed"
            mode="single-action"
            label-text="Pressed"
            supporting-text="Pressed ripple stays on the row action surface"
            @action="onAction"
          />
        </MDStateLayerForcedStateProvider>
      </MDList>
    </section>

    <section class="md-list-item-interaction-states-story__section">
      <h3 class="md-list-item-interaction-states-story__title">Multi-action surface</h3>
      <MDList list-style="segmented">
        <MDStateLayerForcedStateProvider hovered>
          <MDListItem
            data-visual-state="hover"
            class="md-state_hover"
            mode="multi-action"
            label-text="Primary hover"
            supporting-text="The primary surface does not collapse to just the text column"
            @action="onAction"
          >
            <template #trailingAction>
              <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
            </template>
          </MDListItem>
        </MDStateLayerForcedStateProvider>
        <MDListItem
          data-testid="md-list-multi-action-independence"
          mode="multi-action"
          label-text="Trailing action independence"
          supporting-text="The secondary action keeps its own target and hit area"
          @action="onPrimaryAction"
        >
          <template #trailingAction>
            <MDIconButton
              tooltip="Edit"
              color="outlined"
              md-symbol-name="edit"
              @click="onTrailingAction"
            />
          </template>
        </MDListItem>
        <MDListItem
          mode="multi-action"
          label-text="Trailing action hover"
          supporting-text="Trailing action state layer is local to the trailing target, row stays resting"
          @action="onAction"
        >
          <template #trailingAction>
            <MDIconButton class="md-state_hover" tooltip="Options" md-symbol-name="more_vert" />
          </template>
        </MDListItem>
      </MDList>
      <p class="md-list-item-interaction-states-story__counts">
        <span id="md-list-primary-action-count">{{ primaryActionCount }}</span>
        <span id="md-list-trailing-action-count">{{ trailingActionCount }}</span>
      </p>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-interaction-states-story {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24dp;
  width: min(360dp, calc(100vw - 32dp));
}

.md-list-item-interaction-states-story__section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8dp;
}

.md-list-item-interaction-states-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-interaction-states-story__counts {
  display: flex;
  gap: 12dp;
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-small-font);
  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}
</style>
