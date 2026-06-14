<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import MDIconButton from '../Button/MDIconButton.vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';

const interactionRef = useTemplateRef<HTMLElement>('interactionRef');
const trailingHoverTarget = useTemplateRef<HTMLElement>('trailingHoverTarget');
const rootAttrs = {
  'data-testid': 'visual-md-list-interaction-states',
};
const hoverAttrs = { 'data-visual-state': 'hover' };
const focusAttrs = { 'data-visual-state': 'focus' };
const pressedAttrs = { 'data-visual-state': 'pressed' };
const multiActionIndependenceAttrs = {
  'data-testid': 'md-list-multi-action-independence',
};
const onAction = () => {};
const primaryActionCount = ref(0);
const trailingActionCount = ref(0);

const onPrimaryAction = () => {
  primaryActionCount.value += 1;
};

const onTrailingAction = () => {
  trailingActionCount.value += 1;
};

onMounted(() => {
  const root = interactionRef.value;
  if (!root) {
    return;
  }

  // Single-action: MDStateLayer is inside __primary-action.
  root
    .querySelector<HTMLElement>(
      '[data-visual-state="hover"].md-list-item_mode_single-action .md-list-item__primary-action',
    )
    ?.classList.add('md-state_hover');
  root
    .querySelector<HTMLElement>(
      '[data-visual-state="focus"].md-list-item_mode_single-action .md-list-item__primary-action',
    )
    ?.classList.add('md-state_focused');
  root
    .querySelector<HTMLElement>(
      '[data-visual-state="pressed"].md-list-item_mode_single-action .md-list-item__primary-action',
    )
    ?.classList.add('md-state_pressed');

  // Multi-action: MDStateLayer is inside __primary-action (which is position: absolute;
  // inset: 0 covering the full row). Add the state class to __primary-action.
  root
    .querySelector<HTMLElement>(
      '[data-visual-state="hover"].md-list-item_mode_multi-action .md-list-item__primary-action',
    )
    ?.classList.add('md-state_hover');

  // Trailing action hover: add hover state to the icon button root via template ref so that
  // the trailing state layer shows independently from the row-level state layer.
  trailingHoverTarget.value?.firstElementChild?.classList.add('md-state_hover');
});
</script>

<template>
  <div
    ref="interactionRef"
    v-bind="rootAttrs"
    class="visual-surface md-list-item-interaction-states-story"
  >
    <section class="md-list-item-interaction-states-story__section">
      <h3 class="md-list-item-interaction-states-story__title">Single-action surface</h3>
      <MDList variant="expressive">
        <MDListItem
          v-bind="hoverAttrs"
          mode="single-action"
          label-text="Hover"
          supporting-text="The state layer spans the row action surface"
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
        <MDListItem
          v-bind="focusAttrs"
          mode="single-action"
          label-text="Focus"
          supporting-text="Focus stays inside the row action shape"
          @action="onAction"
        />
        <MDListItem
          v-bind="pressedAttrs"
          mode="single-action"
          label-text="Pressed"
          supporting-text="Pressed ripple stays on the row action surface"
          @action="onAction"
        />
      </MDList>
    </section>

    <section class="md-list-item-interaction-states-story__section">
      <h3 class="md-list-item-interaction-states-story__title">Multi-action surface</h3>
      <MDList variant="expressive" list-style="segmented">
        <MDListItem
          v-bind="hoverAttrs"
          mode="multi-action"
          label-text="Primary hover"
          supporting-text="The primary surface does not collapse to just the text column"
          @action="onAction"
        >
          <template #trailingAction>
            <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
          </template>
        </MDListItem>
        <MDListItem
          v-bind="multiActionIndependenceAttrs"
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
            <!--
              The wrapper span is used via template ref so onMounted can add md-state_hover
              to the icon button's root element, showing the trailing state layer is independent
              from the row-level state layer.
            -->
            <span ref="trailingHoverTarget">
              <MDIconButton tooltip="Options" md-symbol-name="more_vert" />
            </span>
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
  gap: 24dp;
  width: min(360dp, calc(100vw - 32dp));
}

.md-list-item-interaction-states-story__section {
  display: grid;
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
