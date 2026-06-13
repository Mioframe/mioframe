<script setup lang="ts">
import { MDCheckbox } from '../Checkbox';
import MDIconButton from '../Button/MDIconButton.vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-item-configurations',
};

const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-configurations-story">
    <MDListItem label-text="One-line item" />

    <MDListItem
      label-text="Two-line item"
      supporting-text="Supporting text uses the baseline two-line height."
    />

    <MDListItem
      label-text="Overline item"
      overline="Category"
      supporting-text="Overline sits above the label in label-small."
    />

    <MDListItem
      label-text="Three-line item"
      supporting-text="Supporting text can expand across two supporting lines in the three-line configuration."
      :line-count="3"
    />

    <MDListItem
      mode="single-action"
      label-text="Leading icon"
      supporting-text="Icons stay in the leading slot."
    >
      <template #leading>
        <MDSymbol name="draft" />
      </template>
    </MDListItem>

    <MDListItem
      mode="single-action"
      label-text="Leading avatar"
      supporting-text="Avatars also use the leading slot."
    >
      <template #leading>
        <span class="md-list-item-configurations-story__avatar">AB</span>
      </template>
    </MDListItem>

    <MDListItem
      mode="single-action"
      label-text="Trailing text"
      supporting-text="Meta information belongs in the trailing slot."
    >
      <template #trailing>
        <span class="md-list-item-configurations-story__trailing-text">12 min</span>
      </template>
    </MDListItem>

    <MDListItem
      mode="single-action"
      label-text="Trailing icon"
      supporting-text="Static trailing icons stay non-interactive."
    >
      <template #trailing>
        <MDSymbol name="chevron_right" />
      </template>
    </MDListItem>

    <MDListItem
      mode="multi-action"
      label-text="Trailing action"
      supporting-text="Secondary actions are separated from the primary action."
      @action="onAction"
    >
      <template #trailingAction>
        <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
      </template>
    </MDListItem>

    <MDListItem
      mode="multi-select"
      label-text="Selection control"
      supporting-text="Use one selection interaction per row."
      selected
    >
      <template #selectionControl>
        <MDCheckbox presentation :model-value="true" />
      </template>
    </MDListItem>

    <MDListItem
      mode="single-action"
      label-text="Disabled item"
      supporting-text="Disabled state preserves the list layout."
      disabled
    >
      <template #leading>
        <MDSymbol name="lock" />
      </template>
    </MDListItem>
  </div>
</template>

<style scoped>
.md-list-item-configurations-story {
  width: min(320dp, calc(100vw - 32dp));
}

.md-list-item-configurations-story__avatar {
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

.md-list-item-configurations-story__trailing-text {
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-small-font);
  font-size: var(--md-sys-typescale-label-small-size);
  font-weight: var(--md-sys-typescale-label-small-weight);
  line-height: var(--md-sys-typescale-label-small-line-height);
  letter-spacing: var(--md-sys-typescale-label-small-tracking);
}
</style>
